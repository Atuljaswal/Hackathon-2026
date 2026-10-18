import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

/** Registers with Firebase Auth and creates a private Firestore profile. */
export async function signUp(email, password, displayName) {
  const name = displayName.trim();
  if (name.length < 2 || name.length > 40) {
    throw new Error('Display name must be 2–40 characters.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = credential.user;
  await updateProfile(user, { displayName: name });
  await ensureMyProfile(user, name);
  return user;
}

/** Returns an authenticated Firebase user; call getMyProfile separately for profile data. */
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureMyProfile(credential.user);
  return credential.user;
}

export function logout() {
  return signOut(auth);
}

/** Subscribe to login/logout changes. Call the returned function when unmounting. */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Recover a profile if an account was created but its initial Firestore write failed. */
export async function ensureMyProfile(user = auth.currentUser, fallbackName = null) {
  if (!user) throw new Error('Please sign in first.');
  const profileRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) return snapshot.data();
  const displayName = (fallbackName || user.displayName || 'Member').slice(0, 40);
  const data = {
    uid: user.uid,
    displayName,
    categories: [],
    canTeach: [],
    wantsToLearn: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(profileRef, data);
  return data;
}
