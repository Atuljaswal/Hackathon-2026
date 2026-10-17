import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import {
  refreshQueue, requestMatch, watchIncomingRequests, watchMyQueue, watchOutgoingRequests,
} from './matchingService.js';
import { chooseAutomaticCandidate } from './autoMatchSelection.js';

/**
 * Drive automatic proposal creation while this approved tester's page is open.
 * Joining the queue opts in to proposals. Both participants must now Accept
 * before an active match is created. No one is put in chat automatically. Stop the listener when the component unmounts/logs out.
 *
 * This browser-side matching loop is for a controlled prototype with a small
 * number of testers. Production requires server-managed reservations, presence,
 * rate limiting, age-group isolation, blocking, reporting and expiry.
 */
export function startAutomaticMatching(onStatus, onError) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Log in to start matchmaking.');

  let stopped = false;
  let queue = null;
  let candidates = [];
  let incoming = [];
  let outgoing = [];
  let subscribingCategory = null;
  let stopCandidates = () => {};
  let inFlight = false;
  let lastAttempt = 0;
  const ATTEMPT_GAP_MS = 5000;
  const RECENT_PARTNER_COOLDOWN_MS = 30_000;

  const status = message => { if (!stopped) onStatus?.(message); };
  const fail = err => { if (!stopped) onError?.(err); };

  async function attempt() {
    if (stopped || inFlight || queue?.status !== 'waiting') return;
    if (incoming.some(m => m.status === 'pending') ||
        outgoing.some(m => m.status === 'pending' || m.status === 'accepted')) {
      status('A match proposal is pending.');
      return;
    }
    // Don't immediately pair the same people again after Skip, timeout or
    // Next Person. Prefer someone new; with only two testers, wait 30s.
    const recentPartners = new Set(outgoing
      .filter(m => ['ended', 'expired', 'declined'].includes(m.status) &&
        m.updatedAt?.toMillis?.() >= Date.now() - RECENT_PARTNER_COOLDOWN_MS)
      .map(m => m.to));
    const person = chooseAutomaticCandidate(
      candidates.filter(p => !recentPartners.has(p.uid)), uid, queue.category,
    );
    if (!person) {
      status('Waiting for a compatible tester in this interest queue...');
      return;
    }
    if (Date.now() - lastAttempt < ATTEMPT_GAP_MS) return;
    lastAttempt = Date.now();
    inFlight = true;
    status('Found a candidate; proposing a random match...');
    try {
      await requestMatch(person.uid, queue.category);
      status('Random match proposed to both people. Waiting for two acceptances.');
    } catch (err) {
      // The other participant may have already matched or left. Retry later.
      if (String(err.message).includes('no longer available')) {
        status('Candidate was taken; searching for another...');
      } else {
        fail(err);
      }
    } finally {
      inFlight = false;
    }
  }

  function updateQueue(next) {
    queue = next;
    const category = queue?.status === 'waiting' ? queue.category : null;
    if (category !== subscribingCategory) {
      stopCandidates();
      stopCandidates = () => {};
      candidates = [];
      subscribingCategory = category;
      if (category) {
        // Single-field category filter avoids requiring a composite index.
        stopCandidates = onSnapshot(
          query(collection(db, 'lobby'), where('category', '==', category), limit(50)),
          snapshot => {
            candidates = snapshot.docs.map(d => d.data());
            void attempt();
          }, fail,
        );
      }
    }
    if (!next) status('Not searching. Choose an interest and join the queue.');
    else if (next.status === 'busy') status('Match proposed or active.');
    else void attempt();
  }

  const subscriptions = [
    watchMyQueue(updateQueue, fail),
    watchIncomingRequests(data => { incoming = data; void attempt(); }, fail),
    watchOutgoingRequests(data => { outgoing = data; void attempt(); }, fail),
  ];

  // Small periodic retry handles transient conflicts; refresh prevents an
  // actively open waiting page from appearing stale after five minutes.
  const retry = setInterval(() => { void attempt(); }, 5000);
  const heartbeat = setInterval(async () => {
    if (stopped || inFlight || queue?.status !== 'waiting') return;
    try { await refreshQueue(queue.category); }
    catch (err) { if (!stopped) fail(err); }
  }, 60000);

  return () => {
    stopped = true;
    clearInterval(retry);
    clearInterval(heartbeat);
    stopCandidates();
    subscriptions.forEach(stop => stop());
  };
}
