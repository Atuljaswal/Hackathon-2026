import { useState } from 'react'
import { groups } from './catalog'
export default function SkillChains({ onRecord, activities }) {
  const [group, setGroup] = useState(null)
  const [note, setNote] = useState('')
  const [kind, setKind] = useState('practiced')
  const [skill, setSkill] = useState('')
  const [saved, setSaved] = useState(false)
  function join(item) { setGroup(item); setSkill(item.skills[0]); setNote(''); setSaved(false) }
  function record(event) { event.preventDefault(); if (!note.trim()) return; onRecord({ kind, skill, title: group.title, source: 'Skill Chain', groupId: group.id, note: note.trim() }); setNote(''); setSaved(true) }
  return <section className="feature-page"><span className="eyebrow">LEARN TOGETHER. PASS IT ON.</span><h1>Skill Chains</h1><p>Open learning circles where each person can practise, share, and build on an idea.</p><p className="hint">Demo rooms: contributions stay in this browser. No other members are connected.</p>
    {!group ? <div className="feature-list">{groups.map(item => <article key={item.id}><div><span className="detail-label">{item.skills.join(' + ')}</span><h2>{item.title}</h2><p>{item.steps.join(' → ')}</p></div><button className="primary" onClick={() => join(item)}>Open circle</button></article>)}</div> : <div className="work-area"><button className="secondary" onClick={() => setGroup(null)}>← All circles</button><h2>{group.title}</h2><ol className="chain-steps">{group.steps.map(step => <li key={step}>{step}</li>)}</ol><form onSubmit={record}><div className="form-pair"><label>My contribution<select value={kind} onChange={event => setKind(event.target.value)}><option value="practiced">I practised</option><option value="shared">I shared a skill</option></select></label><label>Skill<select value={skill} onChange={event => setSkill(event.target.value)}>{group.skills.map(item => <option key={item}>{item}</option>)}</select></label></div><label>{group.prompt}<textarea required maxLength={3000} value={note} onChange={event => { setNote(event.target.value); setSaved(false) }}/></label><button className="primary" disabled={!note.trim()}>Save contribution</button>{saved && <p role="status">Added to this demo circle and your Passport.</p>}</form><h3>Your contributions</h3>{activities.filter(item => item.groupId === group.id).map(item => <div className="contribution" key={item.id}><small>{item.kind === 'shared' ? 'Shared' : 'Practised'} · {item.skill}</small><p>{item.note}</p></div>)}</div>}
  </section>
}
