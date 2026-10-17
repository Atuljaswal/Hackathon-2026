import { useState } from 'react'
import { teachers } from '../matching/teachers'

export default function Passport({ completed, activities }) {
  const [filter, setFilter] = useState('all')
  const sessionEntries = completed.flatMap(session => {
    const person = teachers.find(teacher => teacher.id === session.teacherId)?.name || 'a learning partner'
    const base = { date: session.completedAt, source: session.mode === 'sos' ? 'Skill SOS' : session.mode === 'swap' ? 'Skill swap' : 'Roulette', person }
    const entries = [{ ...base, id: session.id, kind: 'practiced', skill: session.skill, title: `Practised with ${person}` }]
    if (session.offeredSkill) entries.push({ ...base, id: `${session.id}-shared`, kind: 'shared', skill: session.offeredSkill, personId: session.teacherId, title: `Shared with ${person}` })
    return entries
  })
  const entries = [...sessionEntries, ...activities].sort((a, b) => b.date - a.date)
  const visible = entries.filter(item => filter === 'all' || item.kind === filter)
  const skills = [...new Set(entries.map(item => item.skill))]
  const shared = entries.filter(item => item.kind === 'shared')
  const practiced = entries.filter(item => item.kind === 'practiced')
  const highlights = skills.map(skill => {
    const practiceCount = practiced.filter(item => item.skill === skill).length
    const people = new Set(shared.filter(item => item.skill === skill && item.personId).map(item => item.personId)).size
    return { skill, practiceCount, people }
  })
  return <section className="feature-page passport-log"><span className="eyebrow">YOUR SKILL PASSPORT</span><h1>Shared. Practised. Discovered.</h1><p>A simple history of the skills you give and the skills you grow.</p><div className="passport-summary"><span><strong>{shared.length}</strong> contributions shared</span><span><strong>{practiced.length}</strong> practice activities</span><span><strong>{skills.length}</strong> skills explored</span></div>
    {highlights.length > 0 && <ul className="passport-highlights">{highlights.map(item => <li key={item.skill}>{item.people > 0 && <span>Helped {item.people} {item.people === 1 ? 'person' : 'people'} with {item.skill}. </span>}{item.practiceCount > 0 && <span>Completed {item.practiceCount} {item.skill} practice {item.practiceCount === 1 ? 'activity' : 'activities'}.</span>}</li>)}</ul>}
    <div className="log-toolbar"><h2>Activity log</h2><div className="chips">{[['all', 'All'], ['shared', 'Shared'], ['practiced', 'Practised']].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
    {visible.length ? <ol className="activity-log">{visible.map(item => <li key={item.id}><time dateTime={new Date(item.date).toISOString()}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time><span className={`activity-kind ${item.kind}`}>{item.kind === 'shared' ? 'Shared' : 'Practised'}</span><div><strong>{item.skill}</strong><p>{item.title}</p>{item.note && <details><summary>Practice notes</summary><p>{item.note}</p></details>}</div><small>{item.source}</small></li>)}</ol> : <p className="empty">No {filter === 'all' ? '' : filter === 'shared' ? 'sharing ' : 'practice '}activity yet. Complete a session, try a challenge, or contribute to a Skill Chain.</p>}
    <p className="hint">Browser-local demo history. Shared contributions are self-recorded; people helped counts distinct partners in completed demo swaps. This is a learning log, not a proficiency rating.</p>
  </section>
}
