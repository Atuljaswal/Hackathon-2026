import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import MatchingPage from './MatchingPage.jsx';
import ChatPage from './ChatPage.jsx';
import { startAutomaticMatching } from '../services/autoMatchService.js';
import {
  PROPOSAL_DURATION_MS, acceptMatch, endMatch, expireProposal, joinQueue,
  leaveQueue, nextPerson, watchIncomingRequests, watchMyQueue, watchOutgoingRequests,
} from '../services/matchingService.js';
import { sendMessage, watchMessages } from '../services/chatService.js';

// This flow displays real Firebase matches; the old demo components are unchanged.
export default function LiveMatchingFlow({ page, categories, chosenMode, navigate, onQueueChange, isVisible = true }) {
  const [queue, setQueue] = useState(undefined);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [autoStatus, setAutoStatus] = useState('Looking for a shared interest…');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const onError = err => setError(err.message || String(err));
    const stops = [
      watchMyQueue(next => { setQueue(next); onQueueChange?.(next); }, onError),
      watchIncomingRequests(setIncoming, onError),
      watchOutgoingRequests(setOutgoing, onError),
      startAutomaticMatching(setAutoStatus, onError),
    ];
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => { clearInterval(timer); stops.forEach(stop => stop()); };
  }, [uid]);

  const requests = useMemo(() => [...incoming, ...outgoing].filter((item, index, all) =>
    all.findIndex(other => other.id === item.id) === index), [incoming, outgoing]);
  const current = requests.find(item => item.id === queue?.matchId) || null;
  const pending = current?.status === 'pending' ? current : null;
  const accepted = current?.status === 'accepted' ? current : null;
  const peerName = current
    ? (current.from === uid ? current.toDisplayName : current.fromDisplayName) || 'Match'
    : 'Match';
  const created = pending?.createdAt?.toMillis?.();
  const seconds = created == null ? null : Math.max(0, Math.ceil(
    (created + PROPOSAL_DURATION_MS - now) / 1000,
  ));

  useEffect(() => {
    if (page === 'matching' && accepted) navigate('chat');
  }, [page, accepted?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page === 'chat' && queue !== undefined && !accepted) navigate('matching');
  }, [page, queue?.status, accepted?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pending?.id || seconds !== 0) return;
    let active = true;
    const close = async () => {
      try { await expireProposal(pending.id); }
      catch (err) { if (active && err.code !== 'permission-denied') setError(err.message); }
    };
    void close();
    const retry = setInterval(close, 3000);
    return () => { active = false; clearInterval(retry); };
  }, [pending?.id, seconds === 0]);

  useEffect(() => {
    if (page !== 'chat' || !accepted?.id) { setMessages([]); return; }

    const matchId = accepted.id;
    let listening = true;
    const stop = watchMessages(matchId, setMessages, async err => {
      if (!listening) return;

      // Firestore correctly revokes chat-message access as soon as either person
      // ends a match. The old listener may report that expected revocation
      // before React has had a chance to unsubscribe and change pages.
      if (err.code === 'permission-denied') {
        try {
          const matchSnapshot = await getDoc(doc(db, 'matchRequests', matchId));
          if (!listening || !matchSnapshot.exists() ||
              matchSnapshot.data().status !== 'accepted') return;
        } catch {
          // If we cannot verify closure, show the original permission error.
        }
      }
      if (listening) setError(err.message || String(err));
    });
    return () => { listening = false; stop(); };
  }, [page, accepted?.id]);

  async function run(action) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err.message || String(err)); }
    finally { setBusy(false); }
  }

  const exitSearch = () => run(async () => { await leaveQueue(); navigate('interests'); });
  const cancelSearch = () => run(async () => { await leaveQueue(); navigate('home'); });
  const leaveChat = () => run(async () => {
    if (accepted) await endMatch(accepted.id);
    else await leaveQueue();
    navigate('home');
  });
  const skip = () => run(async () => {
    if (current) await nextPerson(current.id, queue?.categories || categories);
    else if (!queue) await joinQueue(categories);
  });
  const submitMessage = e => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !accepted) return;
    void run(async () => { await sendMessage(accepted.id, text); setDraft(''); });
  };

  if (page === 'chat' && accepted) {
    const display = peerName;
    const peer = {
      id: accepted.from === uid ? accepted.to : accepted.from,
      name: display,
      initials: display.slice(0, 2).toUpperCase(),
      categories: [accepted.category],
      hue: 'blue',
    };
    return <>
      {error && <p className="auth-error live-chat-error" role="alert">{error}</p>}
      <ChatPage live match={peer} matchId={accepted.id} currentUid={uid} busy={busy} messages={messages}
        draft={draft} setDraft={setDraft} sendMessage={submitMessage}
        callVisible={isVisible}
        leaveChat={leaveChat} nextPerson={skip}/>
    </>;
  }

  return <MatchingPage
    categories={queue?.categories || categories}
    chosenMode={chosenMode}
    queue={queue}
    pending={pending}
    accepted={accepted}
    peerName={peerName}
    seconds={seconds}
    alreadyAccepted={(pending?.acceptedBy || []).includes(uid)}
    autoStatus={autoStatus}
    busy={busy}
    error={error}
    onEditInterests={exitSearch}
    onCancel={cancelSearch}
    onStartSearch={() => run(() => joinQueue(categories))}
    onAccept={() => run(() => acceptMatch(pending.id))}
    onDecline={skip}
    onOpenChat={() => navigate('chat')}
  />;
}
