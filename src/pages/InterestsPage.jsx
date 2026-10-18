import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { StageTag } from '../components/Shared.jsx';
import { CATEGORIES } from '../data/demoData.js';

export default function InterestsPage({ chosenMode, categories, toggleCategory, goal, setGoal, mode, startSearch, navigate }) {
  return (
    <section className="flow-page wrap narrow-flow">
            <div className="backline"><button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17}/> Back</button><div className="step-label">Step 1 of 2</div></div>
            <div className="progress-steps"><span className="step-current"/><span/><span/></div>
            <div className="flow-title"><StageTag>{chosenMode.title}</StageTag><h1>What are you interested in?</h1><p>Choose one or more categories to help us find a good match.</p></div>
            <div className="category-grid">{CATEGORIES.map(({ id, label, Icon }) => <button key={id} className={`category-tile ${categories.includes(id) ? 'selected' : ''}`} aria-pressed={categories.includes(id)} onClick={() => toggleCategory(id)}><span className="category-icon"><Icon size={23}/></span><strong>{label}</strong><span className="selection-indicator">{categories.includes(id) && <Check size={13} strokeWidth={3}/>}</span></button>)}</div>
            <label className="field-label" htmlFor="goal">{mode === 'meet' ? 'Anything you want to talk about?' : mode === 'help' ? 'What would you like help with?' : 'What would you like to share or explore?'  } <span>(optional)</span></label>
            <input id="goal" className="text-input" placeholder="e.g. Practice Japanese, learn guitar, play Minecraft" value={goal} onChange={e => setGoal(e.target.value.slice(0, 100))}/>
            <button className="btn btn-primary full" disabled={categories.length === 0} onClick={startSearch}>Continue <ArrowRight size={18}/></button>
            <p className="small-note"><ShieldCheck size={15}/> Only fictional demo profiles are used in this prototype.</p>
          </section>
  );
}
