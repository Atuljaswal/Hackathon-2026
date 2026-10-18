import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

// This service intentionally only handles messages. Match eligibility and
// authorization are enforced by firestore.rules, not by trusting the browser.
export const MAX_MESSAGE_LENGTH = 1000;
const MAX_RECENT_MESSAGES = 100;

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Log in first.');
  return uid;
}

function messagesRef(matchId) {
  // Firestore auto-generated match IDs use safe path characters.
  if (typeof matchId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(matchId)) {
    throw new Error('Invalid match ID.');
  }
  return collection(db, 'matchRequests', matchId, 'messages');
}

/**
 * Send a plain-text message to an accepted match.
 * Only the two participants can send while the match is accepted; the
 * authoritative check happens in Firestore security rules on every write.
 */
export async function sendMessage(matchId, text) {
  const uid = currentUid();
  const ref = messagesRef(matchId);
  if (typeof text !== 'string') throw new Error('Message must be text.');
  const cleanText = text.trim();
  if (!cleanText || cleanText.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Messages must be 1–${MAX_MESSAGE_LENGTH} characters.`);
  }
  return addDoc(ref, {
    senderId: uid,
    text: cleanText,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribe to the newest 100 messages for this match, in chronological order.
 * Unsubscribe when the component unmounts or when the match ends.
 */
export function watchMessages(matchId, onMessages, onError) {
  currentUid();
  const ref = messagesRef(matchId);
  return onSnapshot(
    query(ref, orderBy('createdAt', 'desc'), limit(MAX_RECENT_MESSAGES)),
    snapshot => onMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).reverse()),
    onError,
  );
}
