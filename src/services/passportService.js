import {
  collection, deleteDoc, doc, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';

// Passport entries are PERSONAL, opt-in records, not proof of a qualification.
// Each activity has one stable ID, so Save cannot create duplicate entries.
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/;

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Log in first.');
  return uid;
}

function checkId(value, label) {
  if (typeof value !== 'string' || !VALID_ID.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

function entryRef(uid, activityId) {
  return doc(db, 'users', uid, 'passportEntries', checkId(activityId, 'activity ID'));
}

/**
 * Save only your OWN entry. The source activity must have been accepted by both
 * match participants and must still be active or stopped in an accepted match.
 * Repeated clicks on Save are idempotent (the entry ID is the activity ID).
 */
export async function saveExperience(matchId) {
  const uid = currentUid();
  checkId(matchId, 'match ID');
  return runTransaction(db, async tx => {
    const matchRef = doc(db, 'matchRequests', matchId);
    const activityRef = doc(db, 'matchRequests', matchId, 'activities', 'current');
    const [matchSnap, activitySnap] = await Promise.all([
      tx.get(matchRef), tx.get(activityRef),
    ]);

    if (!matchSnap.exists() || !activitySnap.exists()) {
      throw new Error('The matching activity could not be found.');
    }
    const match = matchSnap.data();
    const activity = activitySnap.data();
    if (match.status !== 'accepted' || !(match.from === uid || match.to === uid) ||
        !Array.isArray(match.acceptedBy) ||
        ![match.from, match.to].every(person => match.acceptedBy.includes(person))) {
      throw new Error('This match is no longer active.');
    }
    if (!['active', 'stopped'].includes(activity.status) ||
        !Array.isArray(activity.acceptedBy) ||
        ![match.from, match.to].every(person => activity.acceptedBy.includes(person)) ||
        !activity.createdAt || !activity.activityId) {
      throw new Error('Start and accept an activity before saving it.');
    }

    // Snapshot the partner's display name from the already-authorized match.
    // Do not copy their interests or private profile into the Passport.
    const partnerDisplayName = match.from === uid ? match.toDisplayName : match.fromDisplayName;
    if (typeof partnerDisplayName !== 'string' || partnerDisplayName.length < 2 || partnerDisplayName.length > 40) {
      throw new Error('This match has no display-name snapshot. Start a new match to save this experience.');
    }

    const ref = entryRef(uid, activity.activityId);
    const existing = await tx.get(ref);
    if (existing.exists()) return { id: ref.id, alreadySaved: true };

    tx.set(ref, {
      activityId: activity.activityId,
      matchId,
      type: activity.type,
      topic: activity.topic,
      partnerDisplayName,
      activityCreatedAt: activity.createdAt,
      savedAt: serverTimestamp(),
    });
    return { id: ref.id, alreadySaved: false };
  });
}

/** Deleting your entry never modifies the other person's saved experiences. */
export async function deleteExperience(activityId) {
  const uid = currentUid();
  await deleteDoc(entryRef(uid, activityId));
}

/** A bounded, newest-first stream for the signed-in user's Passport page. */
export function watchMyPassport(callback, onError) {
  const uid = currentUid();
  const records = collection(db, 'users', uid, 'passportEntries');
  const recent = query(records, orderBy('savedAt', 'desc'), limit(100));
  return onSnapshot(recent,
    snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError,
  );
}
