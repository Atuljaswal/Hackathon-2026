import { collection, doc, runTransaction, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

// Skill Activities are optional invitations inside an already accepted match.
// One shared "current" activity per match prevents overlapping invitations.
export const ACTIVITY_TYPES = [
  { id: 'explore', label: 'Explore together' },
  { id: 'share', label: 'Share a skill' },
  { id: 'ask', label: 'Ask for help' },
  { id: 'challenge', label: 'Try a challenge' },
];
export const MAX_ACTIVITY_TOPIC_LENGTH = 120;
const TERMINAL = ['declined', 'cancelled', 'stopped'];

function uid() {
  if (!auth.currentUser?.uid) throw new Error('Log in first.');
  return auth.currentUser.uid;
}
function activityRef(matchId) {
  if (typeof matchId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(matchId)) {
    throw new Error('Invalid match ID.');
  }
  return doc(db, 'matchRequests', matchId, 'activities', 'current');
}

/** Initiate an invitation; the creator opts in, the other user must accept. */
export async function createActivityInvite(matchId, type, topic) {
  const me = uid();
  if (!ACTIVITY_TYPES.some(item => item.id === type)) throw new Error('Choose a valid activity.');
  const cleanTopic = typeof topic === 'string' ? topic.trim() : '';
  if (cleanTopic.length < 1 || cleanTopic.length > MAX_ACTIVITY_TOPIC_LENGTH) {
    throw new Error(`Enter a topic (1–${MAX_ACTIVITY_TOPIC_LENGTH} characters).`);
  }
  // New unique activity ID even though the live activity document is reused.
  const activityId = doc(collection(db, 'matchRequests', matchId, 'activities')).id;
  await runTransaction(db, async tx => {
    const ref = activityRef(matchId);
    const snap = await tx.get(ref);
    if (snap.exists() && !TERMINAL.includes(snap.data().status)) {
      throw new Error('Finish or cancel the current activity first.');
    }
    // Firestore rules separately verify both users belong to an accepted match.
    tx.set(ref, {
      activityId, createdBy: me, type, topic: cleanTopic, status: 'invited',
      acceptedBy: [me], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  });
}

/** The recipient agrees. No activity becomes active after only one acceptance. */
export async function acceptActivityInvite(matchId) {
  const me = uid();
  await runTransaction(db, async tx => {
    const ref = activityRef(matchId);
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== 'invited') throw new Error('No invitation is pending.');
    if (snap.data().createdBy === me) throw new Error('Waiting for the other person to accept.');
    tx.update(ref, {
      acceptedBy: [snap.data().createdBy, me],
      status: 'active', updatedAt: serverTimestamp(),
    });
  });
}

async function moveActivity(matchId, allowedStatus, nextStatus, permitted) {
  const me = uid();
  await runTransaction(db, async tx => {
    const ref = activityRef(matchId);
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== allowedStatus) {
      throw new Error('This activity is no longer available.');
    }
    if (!permitted(snap.data(), me)) throw new Error('You cannot perform this action.');
    tx.update(ref, { status: nextStatus, updatedAt: serverTimestamp() });
  });
}

export const declineActivityInvite = matchId =>
  moveActivity(matchId, 'invited', 'declined', (activity, me) => activity.createdBy !== me);
export const cancelActivityInvite = matchId =>
  moveActivity(matchId, 'invited', 'cancelled', (activity, me) => activity.createdBy === me);
export const stopActivity = matchId =>
  moveActivity(matchId, 'active', 'stopped', () => true);

/** Unsubscribe when the match ends or the React component unmounts. */
export function watchActivity(matchId, callback, onError) {
  uid();
  return onSnapshot(activityRef(matchId), snap =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}
