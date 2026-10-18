/**
 * Select a fresh waiting participant sharing at least one selected category.
 *
 * The UID ordering ensures two clients cannot both auto-invite each other.
 * It is a prototype safeguard, NOT a general-purpose multi-user allocator:
 * two lower-UID users may still invite the same higher-UID user concurrently.
 * Only use this within the approved, age-appropriate test cohort.
 */
export function chooseAutomaticCandidate(entries, myUid, categories, now = Date.now(), random = Math.random) {
  if (!myUid || !Array.isArray(categories) || categories.length === 0) return null;
  const cutoff = now - 5 * 60 * 1000;
  const eligible = entries.filter(person =>
    person?.uid && person.uid > myUid &&
    Array.isArray(person.categories) &&
    person.categories.some(c => categories.includes(c)) && person.status === 'waiting' &&
    person.updatedAt?.toMillis?.() >= cutoff
  );
  if (eligible.length === 0) return null;
  const value = random();
  const index = Math.min(eligible.length - 1, Math.max(0, Math.floor(value * eligible.length)));
  return eligible[index];
}
