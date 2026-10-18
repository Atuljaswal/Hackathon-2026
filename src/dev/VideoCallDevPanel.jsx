import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { getLiveKitToken } from '../livekitService.js';
import SkillCall from '../components/SkillCall.jsx';

const button = { padding: '10px 14px', border: '1px solid #777', borderRadius: 8, cursor: 'pointer' };

// Approved-testers-only call test on /?auth-test=1.
// It uses the current Firebase match, never a fictional demo profile ID.
export default function VideoCallDevPanel() {
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [watching, setWatching] = useState(true);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const uid = auth.currentUser?.uid;
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  useEffect(() => {
    if (!uid) return undefined;
    let stopMatch = null;
    let trackedId = null;
    let stopped = false;
    const resetMatch = () => {
      if (stopMatch) stopMatch();
      stopMatch = null;
      trackedId = null;
      if (!stopped) setActiveMatchId(null);
    };
    const fail = (err) => {
      if (!stopped) {
        setWatching(false);
        setError(`Cannot read match: ${err.code || err.message}`);
        resetMatch();
      }
    };
    const stopQueue = onSnapshot(doc(db, 'lobby', uid), (snap) => {
      if (stopped) return;
      const queue = snap.data();
      const nextId = queue?.status === 'busy' ? queue.matchId : null;
      if (nextId === trackedId) return;
      resetMatch();
      setWatching(false);
      if (!nextId) return;
      trackedId = nextId;
      setWatching(true);
      stopMatch = onSnapshot(doc(db, 'matchRequests', nextId), (matchSnap) => {
        if (stopped) return;
        setWatching(false);
        const match = matchSnap.data();
        const confirmed = match?.status === 'accepted'
          && (match.from === uid || match.to === uid)
          && Array.isArray(match.acceptedBy)
          && match.acceptedBy.includes(match.from)
          && match.acceptedBy.includes(match.to);
        setActiveMatchId(confirmed ? nextId : null);
      }, fail);
    }, fail);
    return () => {
      stopped = true;
      stopQueue();
      if (stopMatch) stopMatch();
    };
  }, [uid]);

  // Automatically close the call UI if the accepted match ends.
  useEffect(() => {
    if (call && call.matchId !== activeMatchId) setCall(null);
  }, [call, activeMatchId]);

  async function startCall() {
    if (!activeMatchId || busy) return;
    setBusy(true);
    setError('');
    try {
      if (!serverUrl) throw new Error('Missing VITE_LIVEKIT_URL in .env.local (restart Vite).');
      const result = await getLiveKitToken(activeMatchId);
      if (!result?.token) throw new Error('Token endpoint did not return a LiveKit token.');
      setCall({ token: result.token, matchId: activeMatchId });
    } catch (err) {
      setError(`Could not start call: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return <section style={{ border: '1px solid #bac5d1', borderRadius: 12, marginTop: 24, padding: 18 }}>
    <h2>Video call (developer test)</h2>
    <p>Calls are available only after both approved test accounts accept a real Firebase match.</p>
    {error && <p role="alert" style={{ color: '#a31b1b' }}>{error}</p>}
    {!call && <>
      <p><strong>Match:</strong> {activeMatchId ? 'Both accepted' : watching ? 'Checking…' : 'No accepted match yet'}</p>
      <button type="button" style={button} disabled={!activeMatchId || busy} onClick={startCall}>
        {busy ? 'Connecting…' : 'Start Video Call'}
      </button>
    </>}
    {call && <>
      <button type="button" style={button} onClick={() => setCall(null)}>Leave Video Call</button>
      <SkillCall token={call.token} serverUrl={serverUrl} onLeave={() => setCall(null)} />
    </>}
    <p style={{ fontSize: 12 }}>Allow camera/microphone access only when testing a call. The LiveKit token server must validate the Firebase user and accepted match.</p>
  </section>;
}
