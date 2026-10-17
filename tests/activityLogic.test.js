import test from 'node:test';
import assert from 'node:assert/strict';
import { canSaveActivity, recordSavedActivity } from '../src/activityLogic.js';

const match = { id: 'sam', name: 'Sam', categories: ['Gaming', 'Programming'] };
const empty = () => ({ sessionsCompleted: 0, taughtSessions: 0, peopleHelped: [], learnedCategories: [], ratedSessions: [], recentActivities: [] });

test('saving requires an active match and both explicit opt-ins', () => {
  assert.equal(canSaveActivity({ status: 'none', match, meAgreed: true, peerAgreed: true }), false);
  assert.equal(canSaveActivity({ status: 'invited', match, meAgreed: true, peerAgreed: true }), false);
  assert.equal(canSaveActivity({ status: 'active', match: null, meAgreed: true, peerAgreed: true }), false);
  assert.equal(canSaveActivity({ status: 'active', match, meAgreed: true, peerAgreed: false }), false);
  assert.equal(canSaveActivity({ status: 'active', match, meAgreed: false, peerAgreed: true }), false);
  assert.equal(canSaveActivity({ status: 'active', match, meAgreed: true, peerAgreed: true }), true);
});

test('exploration saves a voluntary activity but does not count a teacher', () => {
  const previous = empty();
  const next = recordSavedActivity(previous, { match, activityType: 'explore', goal: 'Explore Minecraft', id: '1' });
  assert.equal(next.sessionsCompleted, 1);
  assert.equal(next.taughtSessions, 0);
  assert.deepEqual(next.peopleHelped, []);
  assert.deepEqual(next.learnedCategories, ['Gaming', 'Programming']);
  assert.equal(next.recentActivities[0].role, 'Explored');
  assert.equal(previous.sessionsCompleted, 0); // immutable
});

test('sharing counts distinct people helped, not duplicate partners', () => {
  const first = recordSavedActivity(empty(), { match, activityType: 'share', goal: 'Share a building tip', id: '2' });
  const second = recordSavedActivity(first, { match, activityType: 'share', goal: 'Another tip', id: '3' });
  assert.equal(second.taughtSessions, 2);
  assert.deepEqual(second.peopleHelped, ['sam']);
});

test('help and challenge do not automatically add teacher credit', () => {
  const first = recordSavedActivity(empty(), { match, activityType: 'ask', goal: 'Ask for advice', id: '4' });
  const second = recordSavedActivity(first, { match, activityType: 'challenge', goal: 'Try a game challenge', id: '5' });
  assert.equal(second.taughtSessions, 0);
  assert.deepEqual(second.recentActivities.map(item => item.role), ['Challenged', 'Practised']);
});
