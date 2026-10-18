import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { StageTag } from '../components/Shared.jsx';
import { CATEGORIES } from '../data/demoData.js';

export default function InterestsPage({ chosenMode, categories, toggleCategory, goal, setGoal, mode, startSearch, navigate, saving, error, count }) {
  return (
    <section className="flow-page wrap narrow-flow">
            <div className="backline"><button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17}/> Back</button><div className="step-label">Step 1 of 2</div></div>
            <div className="progress-steps"><span className="step-current"/><span/><span/></div>
            <div className="flow-title"><StageTag>{chosenMode.title}</StageTag><h1>What are you interested in?</h1><p>Choose one or more categories to help us find a good match.</p></div>
            <div className="category-grid">{CATEGORIES.map(({ id, label, Icon }) => <button key={id} className={`category-tile ${categories.includes(id) ? 'selected' : ''}`} aria-pressed={categories.includes(id)} onClick={() => toggleCategory(id)}><span className="category-icon"><Icon size={23}/></span><strong>{label}</strong><span className="selection-indicator">{categories.includes(id) && <Check size={13} strokeWidth={3}/>}</span></button>)}</div>
            <label className="field-label" htmlFor="goal">{mode === 'meet' ? 'Anything you want to talk about?' : mode === 'help' ? 'What would you like help with?' : 'What would you like to share or explore?'  } <span>(optional)</span></label>
            <input id="goal" className="text-input" placeholder="e.g. Japanese, Minecraft, guitar" value={goal} onChange={e => setGoal(e.target.value.slice(0, 100))}/>
            <p className="small-note">Use commas for multiple interests (for example: Japanese, Minecraft). Each entry is a category, just like the checkboxes. Maximum 10 total.</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn btn-primary full" disabled={saving || count === 0 || count > 10} onClick={startSearch}>
              {saving ? 'Saving interests…' : 'Continue'} {!saving && <ArrowRight size={18}/>}
            </button>
            <p className="small-note"><ShieldCheck size={15}/> Match with someone when at least one selected interest overlaps. Mutual acceptance is required.</p>
          </section>
  );
}
