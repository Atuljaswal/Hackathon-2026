import Challenges from './features/explore/Challenges'
import SkillChains from './features/explore/SkillChains'
import HelpAndSwap from './features/explore/HelpAndSwap'
import MatchModal from './features/matching/MatchModal'
import ProfileAvatar from './features/profile/ProfileAvatar'
import ProfileSettings from './features/profile/ProfileSettings'
import Passport from './features/passport/Passport'
import { useEffect, useState } from 'react'
import { Shuffle, ArrowUpRight, Sun, Moon } from 'lucide-react'
import { confirmTeaching } from './features/confirmations/confirmation'
import './App.css'
import { teachers } from './features/matching/teachers'
const key = 'skill-roulette-demo-v1'
function restore() {
  try { const value = JSON.parse(localStorage.getItem(key)); if (Array.isArray(value?.sessions) && Array.isArray(value?.confirmations)) return value } catch { /* Start a fresh demo if storage is unavailable. */ }
  return { sessions: [], confirmations: [] }
}
export default function App() {
  const [matchContext, setMatchContext] = useState(null)
  const [matchPool, setMatchPool] = useState(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [photo, setPhoto] = useState(() => { try { return localStorage.getItem('skill-roulette-photo') || '' } catch { return '' } })
  const [theme, setTheme] = useState(() => {
    try { const saved = localStorage.getItem('skill-roulette-theme'); if (saved === 'light' || saved === 'dark') return saved } catch { /* Fall back to system preference. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('skill-roulette-theme', theme) } catch { /* Theme still works for this visit. */ }
  }, [theme])
  function changePhoto(value) {
    setPhoto(value)
    try { if (value) localStorage.setItem('skill-roulette-photo', value); else localStorage.removeItem('skill-roulette-photo') }
    catch { setStorageError('Your photo could not be saved. It will last for this visit only.') }
  }
  const [data, setData] = useState(restore)
  const [page, setPage] = useState('discover')
  const [skill, setSkill] = useState('Design')
  const [match, setMatch] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState('')
  const session = data.sessions.find(item => item.id === sessionId)
  const completed = data.sessions.filter(item => item.status === 'completed')
  const total = teacher => teacher.count + data.confirmations.filter(item => item.teacherId === teacher.id).length
  function save(next) { setData(next); try { localStorage.setItem(key, JSON.stringify(next)) } catch { setStorageError('Storage unavailable: progress lasts until this page closes.') } }
  function update(changes) { save({ ...data, sessions: data.sessions.map(item => item.id === sessionId ? { ...item, ...changes } : item) }) }
  const activities = data.activities || []
  function recordActivity(activity) { save({ ...data, activities: [...activities, { ...activity, id: crypto.randomUUID(), date: Date.now() }] }) }
  function openSpecialMatch(pool, context) { setMatchPool(pool); setMatchContext(context); setMatch(pool[Math.floor(Math.random() * pool.length)]); setMatchOpen(true) }
  function nextMatch() {
    if (!matchPool) { find(); return }
    const alternatives = matchPool.filter(item => item.id !== match.id)
    const pool = alternatives.length ? alternatives : matchPool
    setMatch(pool[Math.floor(Math.random() * pool.length)])
  }
  function find() { setMatchPool(null); setMatchContext(null); const eligible = teachers.filter(item => item.skill === skill); const other = eligible.filter(item => item.id !== match?.id); const pool = other.length ? other : eligible; setMatch(pool[Math.floor(Math.random() * pool.length)]); setMatchOpen(true) }
  function start() { setMatchOpen(false); const id = crypto.randomUUID(); save({ ...data, sessions: [...data.sessions, { id, teacherId: match.id, learnerId: 'demo-you', skill: match.skill, mode: matchContext?.mode || 'roulette', offeredSkill: matchContext?.offeredSkill || null, problem: matchContext?.problem || '', startedAt: Date.now(), status: 'active', messages: [] }] }); setSessionId(id); setPage('session'); setNotice('') }
  function send(event) { event.preventDefault(); if (!draft.trim()) return; update({ messages: [...session.messages, { id: crypto.randomUUID(), text: draft.trim() }] }); setDraft('') }
  function confirm() { const result = confirmTeaching(data, sessionId, Date.now()); if (result.state) save(result.state); setNotice(result.error || 'Thank you! Your teaching confirmation was added.') }
  return <>
    <header><a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('discover') }}><Shuffle/> skillroulette.</a><nav aria-label="Main navigation"><button aria-current={page === 'discover' ? 'page' : undefined} onClick={() => setPage('discover')}>Discover</button><button aria-current={page === 'passport' ? 'page' : undefined} onClick={() => setPage('passport')}>Skill Passport</button>{session && <button onClick={() => setPage('session')}>Your session</button>}</nav><div className="header-tools"><button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>{theme === 'light' ? <Moon size={17}/> : <Sun size={17}/>}<span>{theme === 'light' ? 'Dark' : 'Light'}</span></button><button className="profile-button" aria-label="Edit your profile photo" onClick={() => setProfileOpen(true)}><ProfileAvatar name="You" photoUrl={photo}/></button></div></header>
    <div className="demo">Interactive demo · sample teachers, local messages and browser-saved progress. No live matching or calls yet.</div>
    <div className="feature-nav" role="navigation" aria-label="Learning features">
  {[['discover', 'Skill Roulette'], ['challenges', '5-minute challenges'], ['chains', 'Skill Chains'], ['sos', 'Skill SOS'], ['swap', 'Cross-skill matching'], ['passport', 'Skill Passport']].map(([id, label]) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}>{label}</button>)}
</div>
    <main>{storageError && <p role="alert">{storageError}</p>}
      {page === 'discover' && <><div className="hero"><section><span className="eyebrow">✳ A LITTLE CURIOSITY GOES A LONG WAY</span><h1>You know something.<br/>So does <em>someone else.</em></h1><p className="intro">Swap a skill. Share a moment. Meet someone who can teach you something you didn’t know yesterday.</p><a className="text-link" href="#roulette">Let curiosity choose <ArrowUpRight size={18}/></a><div className="community"><span className="avatar peach">MC</span><span className="avatar purple">AR</span><span className="avatar">ST</span><small>No experts required.<br/>Just people helping people.</small></div></section><section className="panel roulette" id="roulette"><span className="eyebrow">YOUR NEXT AHA MOMENT</span><h2>What are you curious about?</h2><p>Pick an interest. Find a little common ground.</p><div className="chips">{['Design', 'JavaScript', 'Photography'].map(item => <button key={item} aria-pressed={skill === item} onClick={() => { setSkill(item); setMatch(null) }}>{item}</button>)}</div><div className="orbit"><span className="floating one">a fresh perspective ↗</span><Shuffle size={55}/><span className="floating two">your next connection ✧</span></div><button className="primary wide" onClick={find}><Shuffle size={18}/>{match ? 'Try another match' : 'Find my match'}<ArrowUpRight size={18}/></button><small className="hint">A shared interest. A random connection. A new possibility.</small></section></div>
      <section className="how"><div><span className="eyebrow">START WITH HELLO</span><h2>A small exchange.<br/>A bigger world.</h2></div><article><small>01 / CONNECT</small><h3>Find your kind of curious.</h3><p>Meet someone around an interest you share.</p></article><article><small>02 / EXCHANGE</small><h3>A conversation, not a classroom.</h3><p>Ask a question. Share what you know. Keep it casual.</p></article><article><small>03 / GROW</small><h3>Take your learning with you.</h3><p>Build your Skill Passport, one session at a time.</p></article></section></>}
      {page === 'challenges' && <Challenges data={data} onSave={save}/>}
      {page === 'chains' && <SkillChains activities={activities} onRecord={recordActivity}/>}
      {(page === 'sos' || page === 'swap') && <HelpAndSwap key={page} mode={page} onMatch={openSpecialMatch}/>}
      {page === 'passport' && <Passport completed={completed} activities={activities}/>}
      {page === 'session' && session && <section className="panel chat"><span className="eyebrow">{session.skill.toUpperCase()} · DEMO SESSION</span><h2>Learning with {teachers.find(item => item.id === session.teacherId)?.name}</h2><p className="count">✓ {total(teachers.find(item => item.id === session.teacherId))} teaching confirmations</p><p className="hint">Messages stay in this browser. No other person receives them.</p><div className="session-context">{session.problem && <p><strong>Your SOS:</strong> {session.problem}</p>}{session.offeredSkill && <p>You share <strong>{session.offeredSkill}</strong> · You practise <strong>{session.skill}</strong></p>}</div><div className="messages" aria-live="polite">{!session.messages.length && <p className="empty">Start with a question. What would you like to learn?</p>}{session.messages.map(message => <div className="message" key={message.id}><small>You</small><p>{message.text}</p></div>)}</div>{session.status === 'active' ? <><form onSubmit={send}><input aria-label="Your message" placeholder="Ask something you’re curious about…" maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)}/><button className="primary" disabled={!draft.trim()}>Send</button></form><button className="secondary" onClick={() => update({ status: 'completed', completedAt: Date.now() })}>End session</button></> : <div><h3>Did you learn something during this session?</h3><p>One confirmation per learner and teacher every 24 hours, following a new completed session. Their total never resets.</p><div className="actions"><button className="primary" disabled={data.confirmations.some(item => item.sessionId === sessionId)} onClick={confirm}>Yes, I learned something</button><button className="secondary" onClick={() => setPage('passport')}>Skip / view Passport</button></div><p role="status">{notice}</p></div>}</section>}
    </main>{matchOpen && match && <MatchModal teacher={match} total={total(match)} onClose={() => setMatchOpen(false)} onStart={start} onNext={nextMatch} context={matchContext}/>} {profileOpen && <ProfileSettings photo={photo} onPhoto={changePhoto} onClose={() => setProfileOpen(false)}/>}<footer><b>skillroulette.</b><span>A little human connection. A lot of possibility.</span><span>Stay curious ↗</span></footer>
  </>
}




