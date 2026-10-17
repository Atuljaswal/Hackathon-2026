import test from 'node:test'
import assert from 'node:assert/strict'
import { submitChallengeFeedback } from './challengeFeedback.js'
import { COOLDOWN_MS } from '../confirmations/confirmation.js'
const initial = { sessions: [], confirmations: [], exchanges: [{ id: 'e1', partnerId: 'maya', startedAt: 1, deadline: 300001, endedAt: 100, feedback: {} }] }
test('each participant can independently confirm the other', () => {
  const first = submitChallengeFeedback(initial, 'e1', 'demo-you', true, 101).state
  const both = submitChallengeFeedback(first, 'e1', 'maya', true, 102).state
  assert.equal(both.confirmations.length, 2)
  assert.equal(both.confirmations[0].teacherId, 'maya')
  assert.equal(both.confirmations[1].teacherId, 'demo-you')
})
test('No records feedback without adding or removing confirmations', () => {
  const result = submitChallengeFeedback(initial, 'e1', 'demo-you', false, 101).state
  assert.equal(result.confirmations.length, 0)
  assert.equal(result.exchanges[0].feedback['demo-you'].learned, false)
  assert.ok(submitChallengeFeedback(result, 'e1', 'demo-you', true, 102).error)
})
test('rejects outsiders and unfinished exchanges', () => {
  assert.ok(submitChallengeFeedback(initial, 'e1', 'outsider', true, 101).error)
  const active = { ...initial, exchanges: [{ ...initial.exchanges[0], endedAt: null }] }
  assert.ok(submitChallengeFeedback(active, 'e1', 'demo-you', true, 100).error)
  assert.ok(submitChallengeFeedback(active, 'e1', 'demo-you', true, 300001).state)
})
test('shared cooldown applies to another exchange with same teacher', () => {
  const first = submitChallengeFeedback(initial, 'e1', 'demo-you', true, 101).state
  const next = { ...first, exchanges: [...first.exchanges, { ...initial.exchanges[0], id: 'e2', startedAt: 102, endedAt: 200, feedback: {} }] }
  const blocked = submitChallengeFeedback(next, 'e2', 'demo-you', true, 201).state
  assert.equal(blocked.confirmations.length, 1)
  assert.equal(blocked.exchanges[1].feedback['demo-you'].learned, true)
  assert.equal(blocked.exchanges[1].feedback['demo-you'].counted, false)
  assert.equal(submitChallengeFeedback(next, 'e2', 'demo-you', true, 101 + COOLDOWN_MS).state.confirmations.length, 2)
})
