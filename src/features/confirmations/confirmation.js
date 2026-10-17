export const COOLDOWN_MS = 24 * 60 * 60 * 1000

// Pure policy shared with the future trusted backend. Client time is demo-only.
export function confirmTeaching(state, sessionId, now) {
  const session = state.sessions.find(item => item.id === sessionId)
  if (!session || session.status !== 'completed') return { error: 'Complete this session first.' }
  if (state.confirmations.some(item => item.sessionId === sessionId)) return { error: 'This session has already been confirmed.' }
  const previous = state.confirmations.filter(item => item.learnerId === session.learnerId && item.teacherId === session.teacherId)
  const last = previous.reduce((latest, item) => Math.max(latest, item.createdAt), -Infinity)
  if (now - last < COOLDOWN_MS) return { error: 'You can confirm this teacher again 24 hours after your last confirmation.' }
  if (session.startedAt <= last) return { error: 'Start a new session before confirming this teacher again.' }
  return { state: { ...state, confirmations: [...state.confirmations, { sessionId, teacherId: session.teacherId, learnerId: session.learnerId, createdAt: now }] } }
}
