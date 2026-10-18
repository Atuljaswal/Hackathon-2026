import { useEffect, useState } from 'react';
import { auth } from '../firebase.js';
import {
  ACTIVITY_TYPES, MAX_ACTIVITY_TOPIC_LENGTH, watchActivity, createActivityInvite,
  acceptActivityInvite, declineActivityInvite, cancelActivityInvite, stopActivity,
} from '../services/activityService.js';
import { saveExperience } from '../services/passportService.js';

const button = { padding: '9px 12px', margin: '4px 6px 4px 0', cursor: 'pointer', borderRadius: 7, border: '1px solid #aab3bd' };
const LABELS = Object.fromEntries(ACTIVITY_TYPES.map(item => [item.id, item.label]));

/** Developer-only UI; live state shared by BOTH participants via Firestore. */
export default function ActivityDevPanel({ matchId, peerName = 'Matched member' }) {
  const [activity, setActivity] = useState(null);
  const [type, setType] = useState('explore');
  const [topic, setTopic] = useState('');
  const [notice, setNotice] = useState('Checking activities…');
  const [busy, setBusy] = useState(false);
  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    setActivity(null);
    setNotice('Listening for activity invitations…');
    return watchActivity(matchId, setActivity, err =>
      setNotice(`Activity listener failed: ${err.code || err.message}`));
  }, [matchId]);

  async function run(label, operation) {
    setBusy(true);
    try { await operation(); setNotice(`${label} succeeded.`); }
    catch (error) { setNotice(`${label} failed: ${error.code || error.message}`); }
    finally { setBusy(false); }
  }

  const isSender = activity?.createdBy === myUid;
  const pending = activity?.status === 'invited';
  const active = activity?.status === 'active';
  const canInvite = !pending && !active;
  const canSave = !!activity?.activityId && ['active', 'stopped'].includes(activity.status);

  return <section aria-label="Skill Activities" style={{ border: '1px solid #bac5d1', borderRadius: 10, padding: 14, marginTop: 14 }}>
    <h4 style={{ margin: '0 0 6px' }}>Skill Activities (optional)</h4>
    <p style={{ marginTop: 0 }}>Invite {peerName} to explore, share a skill, ask for help, or try a challenge. You can keep chatting or leave at any time.</p>
    <p role="status" style={{ fontSize: 12 }}>{notice}</p>

    {canInvite && <div>
      {activity && <p>Previous activity: {activity.status}. You can invite someone again.</p>}
      <label htmlFor="activity-type">Activity</label>
      <select id="activity-type" value={type} onChange={event => setType(event.target.value)} style={{ display: 'block', margin: '6px 0 10px' }}>
        {ACTIVITY_TYPES.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}
      </select>
      <label htmlFor="activity-topic">Topic / idea</label>
      <input id="activity-topic" value={topic} onChange={event => setTopic(event.target.value)}
        placeholder="What would you like to do together?" maxLength={MAX_ACTIVITY_TOPIC_LENGTH}
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 9, margin: '6px 0 8px' }}/>
      <button style={button} disabled={busy || !topic.trim()}
        onClick={() => run('Invite', () => createActivityInvite(matchId, type, topic))}>Invite to activity</button>
    </div>}

    {pending && <div style={{ background: '#f3f7fc', padding: 12, borderRadius: 8 }}>
      <p><b>Invitation:</b> {LABELS[activity.type] || activity.type} — {activity.topic}</p>
      {isSender ? <>
        <p>Waiting for {peerName} to accept. You can cancel this invitation.</p>
        <button style={button} disabled={busy} onClick={() => run('Cancel', () => cancelActivityInvite(matchId))}>Cancel invitation</button>
      </> : <>
        <p>{peerName} invited you. Would you like to participate?</p>
        <button style={button} disabled={busy} onClick={() => run('Accept', () => acceptActivityInvite(matchId))}>✓ Accept</button>
        <button style={button} disabled={busy} onClick={() => run('Decline', () => declineActivityInvite(matchId))}>✕ Decline</button>
      </>}
    </div>}

    {active && <div style={{ background: '#eef9f2', padding: 12, borderRadius: 8 }}>
      <p><b>Activity in progress:</b> {LABELS[activity.type] || activity.type}</p>
      <p><b>Topic:</b> {activity.topic}</p>
      <p>Both people accepted. Discuss or work on the activity together in chat. No checklist, review, or completion is required.</p>
      <button style={button} disabled={busy} onClick={() => run('Stop', () => stopActivity(matchId))}>Stop activity · Return to chat</button>
    </div>}
    {canSave && <div style={{ padding: 12, border: '1px solid #d6e4f0', borderRadius: 8, marginTop: 12 }}>
      <p><b>Save this experience?</b> This is optional and saves only to your own Passport. The other person doesn't have to save anything.</p>
      <button style={button} disabled={busy} onClick={() => run('Save to my Passport', async () => {
        const result = await saveExperience(matchId);
        if (result.alreadySaved) setNotice('Already in your Passport.');
      })}>Save to my Skill Passport</button>
    </div>}
    <p style={{ fontSize: 12 }}>Stopping an activity does not end your match. Nothing is saved unless you choose to save it. You can delete saved entries later from your Passport.</p>
  </section>;
}
