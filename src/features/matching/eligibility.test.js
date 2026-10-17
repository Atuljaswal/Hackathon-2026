import test from 'node:test'
import assert from 'node:assert/strict'
import { eligibleTeachers } from './eligibility.js'
import { teachers } from './teachers.js'
test('SOS only matches volunteering teachers for the requested skill', () => {
  assert.equal(eligibleTeachers(teachers, { mode: 'sos', wanted: 'Git' })[0].id, 'riley')
  assert.deepEqual(eligibleTeachers(teachers, { mode: 'sos', wanted: 'Photography' }), [])
})
test('swaps require reciprocal interests', () => {
  const result = eligibleTeachers(teachers, { mode: 'swap', wanted: 'Design', offered: 'JavaScript' })
  assert.ok(result.length)
  assert.ok(result.every(item => item.skill === 'Design' && item.wants.includes('JavaScript')))
  assert.deepEqual(eligibleTeachers(teachers, { mode: 'swap', wanted: 'Design', offered: 'Python' }), [])
})
test('unsupported skill returns no match', () => {
  assert.deepEqual(eligibleTeachers(teachers, { mode: 'sos', wanted: 'Python' }), [])
})
