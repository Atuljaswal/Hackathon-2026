import { confirmTeaching } from '../confirmations/confirmation.js'

// Demo policy. Production derives reviewer identity and time on the server.
export function submitChallengeFeedback(data, exchangeId, reviewerId, learned, now) {
  const exchanges = data.exchanges || []
  const exchange = exchanges.find(item => item.id === exchangeId)
  if (!exchange || !['demo-you', exchange.partnerId].includes(reviewerId)) return { error: 'Participant not found.' }
  if (!exchange.endedAt && now < exchange.deadline) return { error: 'Finish the exchange before giving feedback.' }
  if (typeof learned !== 'boolean') return { error: 'Choose Yes or No.' }
  if (exchange.feedback?.[reviewerId]) return { error: 'Feedback already saved.' }
  const teacherId = reviewerId === 'demo-you' ? exchange.partnerId : 'demo-you'
  const sessionId = `${exchange.id}:${reviewerId}`
  let next = data
  let counted = false
  let reason = ''
  if (learned) {
    const session = { id: sessionId, learnerId: reviewerId, teacherId, status: 'completed', startedAt: exchange.startedAt }
    const result = confirmTeaching({ ...data, sessions: [...data.sessions, session] }, sessionId, now)
    if (result.state) { next = { ...data, confirmations: result.state.confirmations }; counted = true }
    else reason = result.error
  }
  return { state: { ...next, exchanges: exchanges.map(item => item.id === exchangeId ? { ...item, feedback: { ...item.feedback, [reviewerId]: { learned, counted, reason, createdAt: now } } } : item) } }
}
