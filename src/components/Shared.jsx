import { Shuffle, Star } from 'lucide-react';

export function Avatar({ person, size = 'md', online = false }) {
  return <span className={`avatar avatar--${size} avatar--${person.hue || 'blue'}`} aria-label={`${person.name} avatar`}>
    {person.initials || person.name.slice(0, 2).toUpperCase()}
    {online && <span className="online-dot" />}
  </span>;
}
export function Logo({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="Go to Skill Roulette homepage">
    <span className="brand-symbol"><Shuffle size={19} strokeWidth={2.6} /></span><span>Skill <b>Roulette</b></span>
  </button>;
}
export function StageTag({ children, kind = 'blue' }) { return <span className={`status-tag status-tag--${kind}`}>{children}</span>; }
export function Stars({ value, small = false }) {
  return <span className="stars"><Star size={small ? 13 : 17} fill="currentColor" /> <strong>{Number(value).toFixed(1)}</strong></span>;
}
