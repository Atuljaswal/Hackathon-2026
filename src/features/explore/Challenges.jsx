import { useEffect, useState } from 'react'
import { teachers } from '../matching/teachers'
import { submitChallengeFeedback } from './challengeFeedback'

export default function Challenges({ data, onSave }) {
  const exchanges = data.exchanges || []
  const active = exchanges.at(-1)
  const [offered, setOffered] = useState('JavaScript')
  const [wanted, setWanted] = useState('Design')
  const [draft, setDraft] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState('')
  const [newExchange, setNewExchange] = useState(false)
  const [simulatePartner, setSimulatePartner] = useState(false)
  const exchange = newExchange ? null : active
  const partner = teachers.find(item => item.id === exchange?.partnerId)
  const remaining = exchange ? Math.max(0, Math.ceil((exchange.deadline - now) / 1000)) : 300
  const finished = exchange && (exchange.endedAt || remaining === 0)
  const secondTurn = exchange && (exchange.switched || remaining <= 150)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  function start(time) {
    const eligible = teachers.filter(item => item.skill === wanted && item.wants.includes(offered))
    if (!eligible.length) { setError('No compatible demo partner. Try sharing JavaScript and learning Design.'); return }
    const person = eligible[Math.floor(Math.random() * eligible.length)]
    const item = { id: crypto.randomUUID(), partnerId: person.id, offered, wanted, startedAt: time, deadline: time + 300000, messages: [], feedback: {} }
    onSave({ ...data, exchanges: [...exchanges, item] })
    setNewExchange(false); setNow(time); setDraft(''); setError(''); setSimulatePartner(false)
  }
  function update(changes) { onSave({ ...data, exchanges: exchanges.map(item => item.id === exchange.id ? { ...item, ...changes } : item) }) }
  function send(event) {
    event.preventDefault()
    if (!draft.trim()) return
    update({ messages: [...exchange.messages, { id: crypto.randomUUID(), text: draft.trim(), sender: simulatePartner ? partner.name : 'You', simulated: simulatePartner }] })
    setDraft('')
  }
  function finish(time) {
    update({ endedAt: time })
    setNow(time)
  }
  function feedback(reviewer, learned, time) {
    const result = submitChallengeFeedback(data, exchange.id, reviewer, learned, time)
    if (result.error) { setError(result.error); return }
    // Add a pair of history rows once; feedback does not create extra activities.
    const recorded = (data.activities || []).some(item => item.exchangeId === exchange.id)
    const activities = recorded ? data.activities : [...(data.activities || []),
      { id: `${exchange.id}-shared`, exchangeId: exchange.id, date: exchange.endedAt || exchange.deadline, kind: 'shared', skill: exchange.offered, personId: exchange.partnerId, title: `Shared with ${partner.name}`, source: 'Five-minute exchange' },
      { id: `${exchange.id}-practiced`, exchangeId: exchange.id, date: exchange.endedAt || exchange.deadline, kind: 'practiced', skill: exchange.wanted, title: `Practised with ${partner.name}`, source: 'Five-minute exchange' }]
    onSave({ ...result.state, activities })
    setError('')
  }
  function feedbackPanel(reviewer, name, target) {
    const response = exchange.feedback[reviewer]
    return <section className="feedback-row"><h3>{name}</h3><p>Did you learn something new from {target}?</p>{response ? <p role="status"><strong>{response.learned ? 'Yes' : 'No'}</strong> · {response.counted ? 'Teaching confirmation added.' : response.learned ? `Feedback saved. ${response.reason}` : 'Feedback saved. No confirmation added.'}</p> : <div className="actions"><button className="primary" onClick={() => feedback(reviewer, true, Date.now())}>Yes, I learned something</button><button className="secondary" onClick={() => feedback(reviewer, false, Date.now())}>No, not this time</button></div>}</section>
  }
  return <section className="feature-page"><span className="eyebrow">TWO PEOPLE. TWO NEW THINGS.</span><h1>Five-minute skill exchange</h1><p>You teach something. Your partner teaches something. Then each of you says whether you learned something new.</p><p className="hint">Local demo: no other person is connected. Partner messages and feedback below are explicitly simulated.</p>
    {!exchange ? <div className="work-area"><div className="form-pair"><label>I can teach<select value={offered} onChange={event => setOffered(event.target.value)}>{['Design', 'JavaScript', 'Photography', 'Git'].map(skill => <option key={skill}>{skill}</option>)}</select></label><label>I want to learn<select value={wanted} onChange={event => setWanted(event.target.value)}>{['Design', 'JavaScript', 'Photography', 'Git'].map(skill => <option key={skill}>{skill}</option>)}</select></label></div><p>Five minutes total: about 2½ minutes each. Keep it to one small idea.</p><button className="primary" onClick={() => start(Date.now())}>Find a demo partner & start</button></div> : <div className="work-area"><div className="row-between"><h2>You & {partner.name}</h2><span className="timer">{finished ? 'Finished' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</span></div><p>You teach <strong>{exchange.offered}</strong> · {partner.name} teaches <strong>{exchange.wanted}</strong></p>
      {!finished ? <><p className="turn-indicator" role="status">{secondTurn ? `${partner.name}'s turn to teach ${exchange.wanted}` : `Your turn to teach ${exchange.offered}`}</p><div className="messages">{!exchange.messages.length && <p className="empty">Share a small idea, example, or question to begin.</p>}{exchange.messages.map(message => <div className="message" key={message.id}><small>{message.sender}{message.simulated ? ' · simulated' : ''}</small><p>{message.text}</p></div>)}</div><form onSubmit={send}><label>Message<textarea required maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)}/></label><label className="simulation-toggle"><input type="checkbox" checked={simulatePartner} onChange={event => setSimulatePartner(event.target.checked)}/>Simulate a partner message (demo only)</label><button className="primary" disabled={!draft.trim()}>Add message</button></form><div className="actions exchange-actions">{!secondTurn && <button className="secondary" onClick={() => update({ switched: true })}>Switch teaching turns</button>}<button className="secondary" onClick={() => finish(Date.now())}>End exchange & give feedback</button></div></> : <><h3>What did you learn?</h3><p className="hint">Yes adds a teaching confirmation when eligible. No does not reduce anyone’s total. Each learner–teacher pair can count again after 24 hours.</p>{feedbackPanel('demo-you', 'Your feedback', partner.name)}<details className="partner-simulation"><summary>Preview partner feedback · demo simulation</summary><p className="hint">In the live app, only your partner can submit this answer from their own account.</p>{feedbackPanel(partner.id, `${partner.name}'s feedback (simulated)`, 'you')}</details><p className="hint">{exchange.feedback[partner.id] ? 'Partner demo feedback recorded.' : 'Partner feedback is pending. It is never filled in automatically.'}</p><button className="secondary" onClick={() => { setNewExchange(true); setError('') }}>Start another exchange</button></>}
    </div>}{error && <p role="alert">{error}</p>}
  </section>
}
