import {
  collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, onSnapshot, query,
  runTransaction, serverTimestamp, where,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';

const lobbyCollection = collection(db, 'lobby');
const requestsCollection = collection(db, 'matchRequests');

// Proposal timer: 60 seconds from Firestore's server-created timestamp, for both users.
export const PROPOSAL_DURATION_MS = 60_000;

function me() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Log in first.');
  return uid;
}
function validCategory(category) {
  if (typeof category !== 'string' || !/^[a-zA-Z0-9 &-]{2,40}$/.test(category)) {
    throw new Error('Select a valid category from your profile.');
  }
}
const lobbyRef = uid => doc(db, 'lobby', uid);
const requestRef = requestId => doc(db, 'matchRequests', requestId);
const participant = (match, uid) => match.from === uid || match.to === uid;

/** Enter the single-category queue. Your saved profile must include this category. */
export async function joinQueue(category) {
  const uid = me();
  validCategory(category);
  // Keep Join Queue atomic with automatic invitations. A delayed join must
  // never overwrite a busy lobby or an accepted match.
  await runTransaction(db, async tx => {
    const current = await tx.get(lobbyRef(uid));
    if (current.exists() && current.data().status === 'busy') {
      throw new Error('Leave your current invitation or match before rejoining the queue.');
    }
    if (current.exists() && current.data().category !== category) {
      throw new Error('Leave the existing queue before switching categories.');
    }
    tx.set(lobbyRef(uid), {
      uid, category, status: 'waiting', updatedAt: serverTimestamp(),
    });
  });
}

/** Remove queue presence; if matched, close the match for both users instead. */
export async function leaveQueue() {
  const uid = me();
  const current = await getDoc(lobbyRef(uid));
  if (!current.exists()) return;
  if (current.data().status === 'busy' && current.data().matchId) {
    return endMatch(current.data().matchId);
  }
  await deleteDoc(lobbyRef(uid));
}

/** Refresh a waiting entry. The test UI uses this when searching again. */
export async function refreshQueue(category) {
  return joinQueue(category);
}

/** Show available approved testers in the same category; private profiles stay private. */
export async function findCandidates(category) {
  const uid = me();
  validCategory(category);
  const snap = await getDocs(query(lobbyCollection, where('category', '==', category), limit(50)));
  const cutoff = Date.now() - 5 * 60 * 1000;
  return snap.docs.map(x => x.data())
    .filter(x => x.uid !== uid && x.status === 'waiting' &&
      x.updatedAt?.toMillis?.() >= cutoff)
    .sort(() => Math.random() - 0.5);
}

/**
 * Create a pending proposal in one transaction and reserve BOTH people.
 * Both must separately press Accept before the request becomes accepted.
 * Either can press Requeue / Next person while it is pending.
 */
export async function requestMatch(targetUid, category) {
  const uid = me();
  validCategory(category);
  if (!targetUid || uid === targetUid) throw new Error('Choose another participant.');
  const request = doc(requestsCollection);
  await runTransaction(db, async tx => {
    const [mine, theirs] = await Promise.all([
      tx.get(lobbyRef(uid)), tx.get(lobbyRef(targetUid)),
    ]);
    if (!mine.exists() || !theirs.exists() ||
        mine.data().status !== 'waiting' || theirs.data().status !== 'waiting' ||
        mine.data().category !== category || theirs.data().category !== category) {
      throw new Error('This participant is no longer available. Try another match.');
    }
    // Reserve both accounts: nobody receives overlapping invitations.
    tx.update(lobbyRef(uid), { status: 'busy', matchId: request.id, updatedAt: serverTimestamp() });
    tx.update(lobbyRef(targetUid), { status: 'busy', matchId: request.id, updatedAt: serverTimestamp() });
    tx.set(request, {
      from: uid, to: targetUid, category, status: 'pending', acceptedBy: [],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  });
  return request.id;
}

/** Each participant must accept; only the SECOND acceptance opens the match. */
export async function acceptMatch(matchId) {
  const uid = me();
  await runTransaction(db, async tx => {
    const ref = requestRef(matchId);
    const request = await tx.get(ref);
    if (!request.exists()) throw new Error('Proposal not found.');
    const match = request.data();
    if (!participant(match, uid) || match.status !== 'pending') {
      throw new Error('Proposal is no longer pending.');
    }
    const created = match.createdAt?.toMillis?.();
    if (!created || Date.now() >= created + PROPOSAL_DURATION_MS) {
      throw new Error('Proposal timer has expired. Requeue to find someone else.');
    }
    const [sender, recipient] = await Promise.all([
      tx.get(lobbyRef(match.from)), tx.get(lobbyRef(match.to)),
    ]);
    if (![sender, recipient].every(s => s.exists() && s.data().status === 'busy' &&
        s.data().matchId === matchId && s.data().category === match.category)) {
      throw new Error('Someone left this proposal. Try another match.');
    }
    const prior = match.acceptedBy || [];
    if (prior.includes(uid)) return; // Already accepted; waiting for the peer.
    const acceptedBy = [...prior, uid];
    tx.update(ref, {
      acceptedBy,
      status: acceptedBy.length === 2 ? 'accepted' : 'pending',
      updatedAt: serverTimestamp(),
    });
  });
}

/** Compatibility: Skip exits this proposal; partner is automatically requeued. */
export async function declineMatch(matchId) {
  return endMatch(matchId);
}

/**
 * Server-authorized expiry: both users return to their existing category queues.
 * The Firestore rules enforce the server-side 60-second deadline; clock skew
 * can't make an early expiry or acceptance authoritative.
 */
export async function expireProposal(matchId) {
  const uid = me();
  await runTransaction(db, async tx => {
    const ref = requestRef(matchId);
    const request = await tx.get(ref);
    if (!request.exists() || !participant(request.data(), uid)) {
      throw new Error('Not your proposal.');
    }
    const match = request.data();
    if (match.status !== 'pending') return; // Other browser already closed it.
    const [sender, recipient] = await Promise.all([
      tx.get(lobbyRef(match.from)), tx.get(lobbyRef(match.to)),
    ]);
    if (![sender, recipient].every(s => s.exists() && s.data().status === 'busy' &&
        s.data().matchId === matchId)) {
      throw new Error('Proposal changed while expiring.');
    }
    tx.update(ref, { status: 'expired', updatedAt: serverTimestamp() });
    for (const person of [match.from, match.to]) {
      tx.update(lobbyRef(person), {
        status: 'waiting', matchId: deleteField(), updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Leave a pending proposal or an accepted match: the person leaving exits
 * the queue, while their partner automatically returns to WAITING. Nobody
 * must answer a survey, save an activity, or confirm a lesson to leave.
 *
 * All changes happen atomically, so neither account remains stuck as busy.
 * We only change a lobby still tied to this exact match, never a newer one.
 */
export async function endMatch(matchId) {
  const uid = me();
  await runTransaction(db, async tx => {
    const ref = requestRef(matchId);
    const request = await tx.get(ref);
    if (!request.exists() || !participant(request.data(), uid)) {
      throw new Error('This is not your conversation.');
    }
    const match = request.data();
    if (['ended', 'declined', 'expired'].includes(match.status)) return;
    if (!['pending', 'accepted'].includes(match.status)) {
      throw new Error('This match cannot be ended.');
    }

    const [senderLobby, recipientLobby] = await Promise.all([
      tx.get(lobbyRef(match.from)), tx.get(lobbyRef(match.to)),
    ]);
    tx.update(ref, { status: 'ended', updatedAt: serverTimestamp() });

    for (const [person, snapshot] of [
      [match.from, senderLobby], [match.to, recipientLobby],
    ]) {
      if (!snapshot.exists() || snapshot.data().status !== 'busy' ||
          snapshot.data().matchId !== matchId) continue;

      if (person !== uid) {
        // Remain discoverable by other *approved* testers, not auto-connected.
        tx.update(lobbyRef(person), {
          status: 'waiting', matchId: deleteField(), updatedAt: serverTimestamp(),
        });
      } else {
        // The person clicking Leave exits matchmaking (even for pending).
        tx.delete(lobbyRef(person));
      }
    }
  });
}

/** End then opt into a fresh search. Never record a skill outcome. */
export async function nextPerson(matchId, category) {
  await endMatch(matchId);
  await joinQueue(category);
}

export function watchMyQueue(callback, onError) {
  return onSnapshot(lobbyRef(me()), s => callback(s.exists() ? s.data() : null), onError);
}

export function watchIncomingRequests(callback, onError) {
  const uid = me();
  return onSnapshot(query(requestsCollection, where('to', '==', uid)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => ['pending', 'accepted'].includes(x.status))),
    onError);
}

export function watchOutgoingRequests(callback, onError) {
  const uid = me();
  return onSnapshot(query(requestsCollection, where('from', '==', uid)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => ['pending', 'accepted', 'declined', 'ended', 'expired'].includes(x.status))),
    onError);
}

export function watchMatch(matchId, callback, onError) {
  return onSnapshot(requestRef(matchId),
    snap => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}
