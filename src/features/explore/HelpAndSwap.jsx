import { eligibleTeachers } from '../matching/eligibility'
import { useState } from 'react'
import { teachers } from '../matching/teachers'
export default function HelpAndSwap({ mode, onMatch }) {
  const sos = mode === 'sos'
  const [wanted, setWanted] = useState(sos ? 'Git' : 'Design')
  const [offered, setOffered] = useState('JavaScript')
  const [problem, setProblem] = useState('')
  const [empty, setEmpty] = useState(false)
  const skills = [...new Set([...teachers.map(item => item.skill), 'Python', 'Japanese'])]
  function submit(event) {
    event.preventDefault()
    const pool = eligibleTeachers(teachers, { mode, wanted, offered })
    if (!pool.length) { setEmpty(true); return }
    setEmpty(false)
    onMatch(pool, { mode, offeredSkill: sos ? null : offered, problem: problem.trim() })
  }
  return <section className="feature-page"><span className="eyebrow">{sos ? 'GET UNSTUCK' : 'TEACH ONE THING. LEARN ANOTHER.'}</span><h1>{sos ? 'Skill SOS' : 'Cross-skill matching'}</h1><p>{sos ? 'Describe the problem and find a volunteer who knows the topic.' : 'Match what you can share with what someone else wants to learn.'}</p><form className="work-area" onSubmit={submit}><div className="form-pair">{!sos && <label>I can share<select value={offered} onChange={event => { setOffered(event.target.value); setEmpty(false) }}>{skills.map(item => <option key={item}>{item}</option>)}</select></label>}<label>{sos ? 'I need help with' : 'I want to learn'}<select value={wanted} onChange={event => { setWanted(event.target.value); setEmpty(false) }}>{skills.map(item => <option key={item}>{item}</option>)}</select></label></div>{sos && <label>Where are you stuck?<textarea required minLength={10} maxLength={1000} placeholder="I'm having trouble understanding Git branches…" value={problem} onChange={event => setProblem(event.target.value)}/></label>}<p className="hint">{sos ? 'Demo volunteers only. Live availability and requests are not connected yet.' : 'Demo matches require both skills to line up. Both sides of a completed exchange appear in your Passport.'}</p><button className="primary" disabled={sos && problem.trim().length < 10}>{sos ? 'Find a demo volunteer' : 'Find a skill swap'}</button>{empty && <p role="status">No compatible demo match for these skills. Try another combination.</p>}</form></section>
}

