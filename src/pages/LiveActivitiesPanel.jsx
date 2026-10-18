import { useEffect, useState } from 'react';
import { BookOpen, Check, MessageCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { auth } from '../firebase.js';
import { StageTag } from '../components/Shared.jsx';
import { ACTIVITIES } from '../data/demoData.js';
import {
  MAX_ACTIVITY_TOPIC_LENGTH,
  watchActivity,
  createActivityInvite,
  acceptActivityInvite,
  declineActivityInvite,
  cancelActivityInvite,
  stopActivity,
} from '../services/activityService.js';
import { saveExperience } from '../services/passportService.js';

const LABELS = Object.fromEntries(ACTIVITIES.map(({ id, title }) => [id, title]));
const CLOSED = ['declined', 'cancelled', 'stopped'];

// The real Firestore activity shared by both people in the accepted match.
// This does not use the simulated lesson state stored by the legacy demo.
export default function LiveActivitiesPanel({ matchId, peerName = 'your match', onBackToChat }) {
  const [activity, setActivity] = useState(undefined);
  const [type, setType] = useState('explore');
  const [topic, setTopic] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    let listening = true;
    setActivity(undefined);
    setNotice('');
    setError('');
    let stop;
    try {
      stop = watchActivity(matchId, next => {
        if (!listening) return;
        setActivity(next);
        setError('');
      }, err => {
        if (!listening) return;
        setError(err.message || String(err));
        setActivity(null);
      });
    } catch (err) {
      setError(err.message || String(err));
      setActivity(null);
    }
    return () => { listening = false; stop?.(); };
  }, [matchId]);

  async function run(operation, success) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await operation();
      if (success) setNotice(typeof success === 'function' ? success(result) : success);
      return result;
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  const pending = activity?.status === 'invited';
  const active = activity?.status === 'active';
  const canInvite = activity !== undefined && (!activity || CLOSED.includes(activity.status));
  const canSave = !!activity?.activityId && ['active', 'stopped'].includes(activity.status);
  const isSender = activity?.createdBy === currentUid;
  const title = LABELS[activity?.type] || activity?.type;
  const personallySaved = savedId === activity?.activityId;

  return (
    <div className="lesson-column">
      <div className="lesson-header">
        <span className="lesson-icon"><Sparkles size={22}/></span>
        <div><h2>Skill activities</h2><p>Optional experiences with your matched partner.</p></div>
      </div>
      <div className="lesson-content">
        {error && <p role="alert" className="auth-error">{error}</p>}
        {notice && <p role="status" className="small-note">{notice}</p>}
        {activity === undefined && <p>Loading activity…</p>}

        {canInvite && <>
          <StageTag>Optional</StageTag>
          <h3>What activity would you like to try?</h3>
          <p className="lesson-summary">Invite {peerName} to explore something new together. They must accept before it starts.</p>
          <div className="activity-options" role="group" aria-label="Choose a skill activity">
            {ACTIVITIES.map(({ id, title: optionTitle, description, Icon }) =>
              <button key={id} type="button" className={`activity-option ${type === id ? 'is-selected' : ''}`}
                aria-pressed={type === id} disabled={busy} onClick={() => setType(id)}>
                <Icon size={18}/><span><strong>{optionTitle}</strong><small>{description}</small></span>
                {type === id && <Check size={17}/>}
              </button>)}
          </div>
          <label className="activity-topic-label" htmlFor="live-activity-topic">Activity idea</label>
          <input id="live-activity-topic" className="text-input activity-topic-input"
            placeholder="What would you like to explore or practice?"
            maxLength={MAX_ACTIVITY_TOPIC_LENGTH} value={topic}
            onChange={e => setTopic(e.target.value)}/>
          <div className="lesson-actions">
            <button className="btn btn-green full" disabled={busy || !topic.trim()}
              onClick={() => run(() => createActivityInvite(matchId, type, topic), () => {
                setTopic('');
                return `Invitation sent to ${peerName}.`;
              })}>
              <Sparkles size={17}/> Invite to activity
            </button>
            <button className="btn btn-outline full" onClick={onBackToChat}>
              <MessageCircle size={16}/> Just keep chatting
            </button>
          </div>
        </>}

        {pending && <>
          <StageTag kind="amber">Invitation pending</StageTag>
          <h3>{activity.topic}</h3>
          <p><strong>{title}</strong></p>
          {isSender ? <>
            <p>Waiting for {peerName} to accept. You can cancel at any time.</p>
            <button className="btn btn-outline full" disabled={busy}
              onClick={() => run(() => cancelActivityInvite(matchId), 'Invitation cancelled.')}>
              <X size={17}/> Cancel invitation
            </button>
          </> : <>
            <p>{peerName} invited you to try this activity. Would you like to join?</p>
            <div className="lesson-actions">
              <button className="btn btn-green full" disabled={busy}
                onClick={() => run(() => acceptActivityInvite(matchId), 'You accepted the activity.')}>
                <Check size={17}/> Accept activity
              </button>
              <button className="btn btn-outline full" disabled={busy}
                onClick={() => run(() => declineActivityInvite(matchId), 'Invitation declined.')}>
                <X size={17}/> Decline
              </button>
            </div>
          </>}
        </>}

        {active && <>
          <StageTag kind="green">Activity in progress</StageTag>
          <h3>{activity.topic}</h3>
          <p><strong>{title}</strong></p>
          <p>You both accepted this activity. Discuss or work on it together in Chat. Either person can stop it without ending the conversation.</p>
          <button className="btn btn-outline full" disabled={busy}
            onClick={() => run(() => stopActivity(matchId), 'Activity stopped. You can keep chatting.')}>
            <X size={17}/> Stop activity
          </button>
        </>}

        {activity?.status === 'stopped' && <>
          <StageTag>Activity ended</StageTag>
          <h3>{activity.topic}</h3>
          <p>You can save this experience to your own Skill Passport or invite your match to a new activity.</p>
        </>}

        {canSave && <div className="session-confirmations">
          <strong>Save to your Skill Passport? <span>(optional)</span></strong>
          <p>This saves an experience to your account only. {peerName} decides independently whether to save theirs.</p>
          <button className="btn btn-green full" disabled={busy || personallySaved}
            onClick={() => run(() => saveExperience(matchId), result => {
              setSavedId(activity.activityId);
              return result?.alreadySaved ? 'Already in your Skill Passport.' : 'Experience saved to your Skill Passport.';
            })}>
            <BookOpen size={17}/> {personallySaved ? 'Saved to my Passport' : 'Save experience'}
          </button>
        </div>}

        {activity && ['cancelled', 'declined'].includes(activity.status) &&
          <p className="small-note">Previous invitation {activity.status}. You can send another invitation.</p>}
      </div>
      <div className="lesson-footer">
        <ShieldCheck size={16}/> Both people must accept an activity. Saving to your Passport is always optional.
      </div>
    </div>
  );
}
