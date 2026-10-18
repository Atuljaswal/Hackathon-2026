import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { normalizeCategories } from './categoryUtils.js';

export async function getMyProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first.');
  const result = await getDoc(doc(db, 'users', user.uid));
  return result.exists() ? result.data() : null;
}

// Private profile interests: no public matching/search access is enabled yet.
export async function updateMySkills({ categories, canTeach, wantsToLearn }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first.');
  const validList = (list, limit) =>
    Array.isArray(list) && list.length <= limit &&
    list.every(value => typeof value === 'string' && value.length > 0 && value.length <= 60);

  if (!validList(categories, 10) || !validList(canTeach, 20) || !validList(wantsToLearn, 20)) {
    throw new Error('Invalid categories or skills.');
  }

  await updateDoc(doc(db, 'users', user.uid), {
    categories,
    canTeach,
    wantsToLearn,
    updatedAt: serverTimestamp(),
  });
}

/** Save the entire interests selection without overwriting skills or other profile data. */
export async function updateMyCategories(categories) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please log in first.');
  const clean = normalizeCategories(categories);
  await updateDoc(doc(db, 'users', user.uid), {
    categories: clean,
    updatedAt: serverTimestamp(),
  });
  return clean;
}
