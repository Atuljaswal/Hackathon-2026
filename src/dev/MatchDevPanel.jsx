import { useEffect, useState } from 'react';
import { auth } from '../firebase.js';
import ChatDevPanel from './ChatDevPanel.jsx';
import ActivityDevPanel from './ActivityDevPanel.jsx';
import { getMyProfile } from '../services/userService.js';
import { startAutomaticMatching } from '../services/autoMatchService.js';
import {
  PROPOSAL_DURATION_MS, joinQueue, leaveQueue, acceptMatch, expireProposal,
  endMatch, nextPerson, watchMyQueue, watchIncomingRequests, watchOutgoingRequests,
} from '../services/matchingService.js';

const button = { padding: '9px 12px', border: '1px solid #999', borderRadius: 7, margin: 3, cursor: 'pointer' };

/** Local-only demo for approved testers; integrate into auth test while signed in. */
export default function MatchDevPanel() {
  const [category, setCategory] = useState('Gaming');
  const [myQueue, setMyQueue] = useState(null);
  const [autoStatus, setAutoStatus] = useState('Waiting to join an interest queue.');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [notice, setNotice] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);
  const [myDisplayName, setMyDisplayName] = useState('You');
  const [now, setNow] = useState(Date.now());
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    getMyProfile().then(p => {
      const items = p?.categories || [];
      setCategories(items);
      setMyDisplayName(p?.displayName || auth.currentUser?.displayName || 'You');
      if (items.length) setCategory(items[0]);
    }).catch(err => setNotice(err.message));
    const fail = err => setNotice(`Listener failed: ${err.message}`);
    const unsubscribe = [
      watchMyQueue(setMyQueue, fail),
      watchIncomingRequests(setIncoming, fail),
      watchOutgoingRequests(setOutgoing, fail),
      startAutomaticMatching(setAutoStatus, err => setAutoStatus(`Auto-match error: ${err.code || err.message}`)),
    ];
    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => { clearInterval(clock); unsubscribe.forEach(stop => stop()); };
  }, []);

  async function run(name, action) {
    setBusy(true);
    try { await action(); setNotice(`${name} succeeded.`); }
    catch (err) { setNotice(`${name} failed: ${err.code || err.message}`); }
    finally { setBusy(false); }
  }

  // Both users view the SAME proposal regardless of who created it.
  const requests = [...incoming, ...outgoing]
    .filter((m, index, all) => all.findIndex(item => item.id === m.id) === index);
  const myMatch = requests.find(m => m.id === myQueue?.matchId);
  const pending = myMatch?.status === 'pending' ? myMatch : null;
  const activeMatch = myMatch?.status === 'accepted' ? myMatch : null;
  const acceptedBy = pending?.acceptedBy || [];
  const hasAccepted = acceptedBy.includes(uid);
  const peer = pending ? (pending.from === uid ? pending.to : pending.from) : null;
  const peerAccepted = peer ? acceptedBy.includes(peer) : false;
  const partnerName = match => !match ? 'Matched member' :
    (match.from === uid ? match.toDisplayName : match.fromDisplayName) || 'Matched member';
  const createdMs = pending?.createdAt?.toMillis?.();
  const secondsLeft = createdMs === undefined ? null : Math.max(0, Math.ceil(
    (createdMs + PROPOSAL_DURATION_MS - now) / 1000,
  ));

  // Both pages use the SAME server-created timestamp. When it runs out,
  // either page can expire the proposal atomically and requeue BOTH accounts.
  // Retry for clock skew: Firestore rules authorize timeout only after server time.
  const expiredPendingId = pending && secondsLeft === 0 ? pending.id : null;
  useEffect(() => {
    if (!expiredPendingId) return;
    let stopped = false;
    let working = false;
    async function closeExpired() {
      if (stopped || working) return;
      working = true;
      try { await expireProposal(expiredPendingId); }
      catch (err) {
        if (!stopped && err.code !== 'permission-denied') {
          setNotice(`Proposal timeout: ${err.code || err.message}`);
        }
      } finally { working = false; }
    }
    void closeExpired();
    const retry = setInterval(() => void closeExpired(), 3000);
    return () => { stopped = true; clearInterval(retry); };
  }, [expiredPendingId]);

  return <section style={{ border: '1px solid #bbb', borderRadius: 12, padding: 18, marginTop: 24 }}>
    <h2>Automatic matching backend test (approved testers only)</h2>
    <p><b>Signed in as:</b> {myDisplayName} &nbsp; <b>Status:</b> {notice}</p>
    <label>Interest: <select value={category} onChange={e => setCategory(e.target.value)}>
      {categories.length
        ? categories.map(c => <option key={c} value={c}>{c}</option>)
        : <option value="Gaming">Gaming (save interests first)</option>}
    </select></label>
    <div>
      <button style={button} disabled={busy || myQueue?.status === 'busy'}
        onClick={() => run('Join queue', () => joinQueue(category))}>Join / Rejoin queue</button>
      <button style={button} disabled={busy || !myQueue}
        onClick={() => run('Leave queue', leaveQueue)}>Leave queue</button>
    </div>
    <p>My lobby: <b>{myQueue?.status || 'not searching'}</b></p>
    <p><b>Automatic matching:</b> {autoStatus}</p>

    <h3>Match proposal — two-person confirmation</h3>
    {!pending && !activeMatch && <p>No active proposal. Join the queue and wait for a compatible tester.</p>}
    {pending && <div style={{ border: '1px solid #9daec2', borderRadius: 10, padding: 16, background: '#f4f8fc' }}>
      <p><b>Interest:</b> {pending.category} &nbsp; <b>Partner:</b> {partnerName(pending)}</p>
      <p><b>WFC (Waiting for Connection)</b></p>
      <p style={{ fontSize: 28, margin: '8px 0', fontVariantNumeric: 'tabular-nums' }}>
        {secondsLeft === null ? 'Syncing timer…' : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`}
      </p>
      {hasAccepted && <p><b>✓ Accepted.</b> Waiting for the other person to accept.</p>}
      {!hasAccepted && peerAccepted && <p><b>The other person has accepted.</b> Please accept or skip.</p>}
      {!hasAccepted && !peerAccepted && <p>Random match found! Both people must accept to connect.</p>}
      <div>
        {!hasAccepted && <button style={button} disabled={busy || secondsLeft === 0}
          onClick={() => run('Accept proposal', () => acceptMatch(pending.id))}>✓ Accept</button>}
        <button style={button} disabled={busy}
          onClick={() => run('Requeue', () => nextPerson(pending.id, pending.category))}>✕ Requeue / Next person</button>
      </div>
      <p style={{ fontSize: 12 }}>The 60-second timer starts at the same moment for both accounts. If it expires, both return to the interest queue automatically.</p>
    </div>}

    <h3>Active match (both accepted)</h3>
    {!activeMatch && <p>Waiting for both people to accept.</p>}
    {activeMatch && <div>
      <p><b>Connected with:</b> {partnerName(activeMatch)} — <b>Both accepted ✓</b> ({activeMatch.category})</p>
      <ChatDevPanel matchId={activeMatch.id} peerName={partnerName(activeMatch)} />
      <ActivityDevPanel matchId={activeMatch.id} peerName={partnerName(activeMatch)} />
      <button style={button} disabled={busy} onClick={() => run('Leave match', () => endMatch(activeMatch.id))}>Leave</button>
      <button style={button} disabled={busy} onClick={() => run('Next person', () => nextPerson(activeMatch.id, activeMatch.category))}>Next person</button>
    </div>}
    <p style={{ fontSize: 12 }}>Approved-testers-only development page. Age-appropriate matching, blocking, reporting and moderation are still needed before public use.</p>
  </section>;
}
