import { ArrowRight, Award, Clock3, Compass, Gamepad2, HeartHandshake, Languages, ShieldCheck, Sparkles } from 'lucide-react';
import { Avatar } from '../components/Shared.jsx';
import { PEOPLE } from '../data/demoData.js';

export default function HomePage({ navigate, startMode }) {
  return (
    <>
    <section className="hero wrap">
              <div className="hero-text">
                <span className="eyebrow"><Sparkles size={15} /> A new way to connect</span>
                <h1>Meet. Discover.<br/><span>Share.</span></h1>
                <p>Meet people with shared interests, chat freely, and discover skills together—only if you feel like it.</p>
                <div className="hero-ctas"><button className="btn btn-primary" onClick={() => startMode('meet')}>Get started <ArrowRight size={18}/></button><button className="btn btn-outline" onClick={() => navigate('passport')}>View Skill Passport</button></div>
                <div className="hero-footnote"><ShieldCheck size={16}/> Private hackathon demo · Approved fictional profiles only</div>
              </div>
              <div className="hero-visual" aria-label="Illustration of people sharing skills">
                <div className="connection-line connection-line-a"/><div className="connection-line connection-line-b"/>
                <div className="illustration-avatar avatar-pos-top"><Avatar person={PEOPLE[0]} size="lg"/></div>
                <div className="illustration-avatar avatar-pos-left"><Avatar person={PEOPLE[2]} size="lg"/></div>
                <div className="illustration-avatar avatar-pos-right"><Avatar person={PEOPLE[3]} size="lg"/></div>
                <span className="skill-orb skill-orb-left"><Gamepad2 size={22}/></span><span className="skill-orb skill-orb-right"><Languages size={22}/></span>
                <div className="center-emblem"><HeartHandshake size={32}/></div>
                <div className="floating-caption"><span className="little-dot"/> Learn something together</div>
              </div>
            </section>
            <section className="path-section section-tinted">
              {/* <div className="wrap">
                <div className="section-heading"><span className="section-eyebrow">CHOOSE YOUR PATH</span><h2>What would you like to do?</h2><p>Choose how you want to connect. Activities are always optional.</p></div>
                <div className="mode-grid">
                  {MODES.map(item => <button key={item.id} className="mode-card" onClick={() => startMode(item.id)}><span className={`mode-icon mode-icon--${item.tone}`}><item.Icon size={29}/></span><h3>{item.title}</h3><p>{item.description}</p><span className="mode-arrow"><ArrowRight size={20}/></span></button>)}
                </div>
              </div> */}
            </section>
            <section className="why-section wrap"><div className="why-row"><div><span className="why-icon"><Compass size={20}/></span><strong>Shared interests</strong><p>Start conversations with common ground.</p></div><div><span className="why-icon"><Clock3 size={20}/></span><strong>Quick sessions</strong><p>Try an activity together only when you want to.</p></div><div><span className="why-icon"><Award size={20}/></span><strong>Real progress</strong><p>Save experiences when both people choose to.</p></div></div></section>
    </>
  );
}
