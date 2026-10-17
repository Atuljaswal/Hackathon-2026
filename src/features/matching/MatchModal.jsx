import Modal from '../../components/Modal'
import ProfileAvatar from '../profile/ProfileAvatar'
import { Check, X, MessageCircle } from 'lucide-react'

export default function MatchModal({ teacher, total, onClose, onStart, onNext, context }) {
  return <Modal titleId="match-title" onClose={onClose}>
    <div className="match-summary" aria-live="polite">
      <div className="match-context"><span>{context?.mode === 'sos' ? 'Volunteer for' : context?.mode === 'swap' ? 'Skill swap · learn' : 'Shared interest ·'} {teacher.skill}</span><span className="sample-label">Demo</span></div>
      <div className="match-person">
        <ProfileAvatar name={teacher.name} photoUrl={teacher.photoUrl} large/>
        <h2 id="match-title">{teacher.name}</h2>
        <span className="skill-badge">{teacher.skill}</span>
      </div>
      <section className="lesson-preview" aria-label="Teaching details">
        <span className="detail-label">CAN HELP YOU WITH</span>
        <p>{teacher.topic}</p>
        <div className="lesson-meta">{context?.offeredSkill && <span>Wants to learn {context.offeredSkill}</span>}<span>{teacher.level}</span><span><MessageCircle size={14} aria-hidden="true"/> Text chat</span></div>
      </section>
      <p className="match-proof"><Check size={15} aria-hidden="true"/><span><strong>{total}</strong> teaching confirmations</span></p>
    </div>
    <div className="match-decisions">
      <button className="decision-option" aria-label="Skip this match and find another" onClick={onNext}>
        <span className="match-decision skip"><X size={28} strokeWidth={1.8} aria-hidden="true"/></span><span>Skip</span>
      </button>
      <button className="decision-option" aria-label="Accept match and start session" onClick={onStart}>
        <span className="match-decision accept"><Check size={30} strokeWidth={1.8} aria-hidden="true"/></span><span>Connect</span>
      </button>
    </div>
  </Modal>
}

