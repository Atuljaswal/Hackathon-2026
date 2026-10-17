import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmTeaching, COOLDOWN_MS } from './confirmation.js'
const session = { id: 's1', learnerId: 'a', teacherId: 'b', startedAt: 1, status: 'completed' }
const initial = { sessions: [session], confirmations: [] }
test('requires completed session', () => {
  assert.ok(confirmTeaching({ ...initial, sessions: [{ ...session, status: 'active' }] }, 's1', 10).error)
})
test('counts once and rejects duplicate session even after cooldown', () => {
  const first = confirmTeaching(initial, 's1', 10).state
  assert.equal(first.confirmations.length, 1)
  assert.ok(confirmTeaching(first, 's1', COOLDOWN_MS + 11).error)
})
test('same pair becomes eligible at exactly 24 hours with a new session', () => {
  const first = confirmTeaching(initial, 's1', 10).state
  const next = { ...first, sessions: [...first.sessions, { ...session, id: 's2', startedAt: 11 }] }
  assert.ok(confirmTeaching(next, 's2', COOLDOWN_MS + 9).error)
  assert.equal(confirmTeaching(next, 's2', COOLDOWN_MS + 10).state.confirmations.length, 2)
})
test('old sessions cannot be reused after the cooldown', () => {
  const first = confirmTeaching(initial, 's1', 10).state
  const next = { ...first, sessions: [...first.sessions, { ...session, id: 's2' }] }
  assert.ok(confirmTeaching(next, 's2', COOLDOWN_MS + 10).error)
})
test('different learner has independent eligibility', () => {
  const first = confirmTeaching(initial, 's1', 10).state
  const next = { ...first, sessions: [...first.sessions, { ...session, id: 's2', learnerId: 'c' }] }
  assert.equal(confirmTeaching(next, 's2', 11).state.confirmations.length, 2)
})
