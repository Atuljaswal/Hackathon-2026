/** Pure demo helpers. No counters change when a user stops or leaves a chat. */
export function canSaveActivity({ status, match, meAgreed, peerAgreed }) {
  return status === 'active' && Boolean(match) && meAgreed === true && peerAgreed === true;
}

const ROLE_LABELS = {
  explore: 'Explored',
  share: 'Shared',
  ask: 'Practised',
  challenge: 'Challenged',
};

/** Only invoke after both participants deliberately opt in to saving. */
export function recordSavedActivity(previous, { match, activityType, goal, id }) {
  if (!ROLE_LABELS[activityType] || !match || !goal) {
    throw new Error('Invalid activity to save');
  }
  const shared = activityType === 'share';
  return {
    ...previous,
    sessionsCompleted: previous.sessionsCompleted + 1,
    taughtSessions: previous.taughtSessions + (shared ? 1 : 0),
    peopleHelped: shared
      ? [...new Set([...previous.peopleHelped, match.id])]
      : [...previous.peopleHelped],
    learnedCategories: shared
      ? [...previous.learnedCategories]
      : [...new Set([...previous.learnedCategories, ...match.categories])],
    recentActivities: [
      { name: match.name, skill: goal, role: ROLE_LABELS[activityType], id },
      ...previous.recentActivities,
    ].slice(0, 5),
  };
}
