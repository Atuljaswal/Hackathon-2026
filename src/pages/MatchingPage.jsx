import { ArrowLeft, ArrowRight, Shuffle, CircleHelp, LockKeyhole } from 'lucide-react';
import { Avatar, StageTag, Stars } from '../components/Shared.jsx';

export default function MatchingPage({ candidate, chosenMode, categories, mode, goal, acceptMatch, nextPerson, navigate }) {
  return (
    <section className="flow-page wrap narrow-flow matching-page">
            <div className="backline"><button className="back-button" onClick={() => navigate('interests')}><ArrowLeft size={17}/> Edit interests</button><div className="step-label">Step 2 of 2</div></div>
            <div className="progress-steps"><span className="step-current"/><span className="step-current"/><span/></div>
            {candidate ? <><div className="flow-title"><StageTag kind="green">Demo match available</StageTag><h1>Meet your next connection</h1><p>Here's a suggested match based on your selected interests.</p></div>
              <div className="match-preview"><div className="match-top"><Avatar person={candidate} size="xl" online/><div className="match-title"><h2>{candidate.name}</h2><p>{candidate.categories.join(' · ')}</p>{mode !== 'meet' && <Stars value={candidate.rating} />}</div><StageTag kind="green">Demo profile</StageTag></div>
                <div className="tag-group">{mode === 'meet' ? <><span>Shared interests: {candidate.categories.join(', ')}</span><span>Talk, explore, or just hang out</span></> : <><span>Can share: {candidate.expertise.join(', ')}</span><span>Wants to explore: {candidate.learning.join(', ')}</span></>}</div>
                {mode !== 'meet' && <div className="match-stats"><div><strong>{candidate.sessions}</strong><span>Example activities</span></div><div><strong>{candidate.helped}</strong><span>Example people helped</span></div></div>}
                <p className="match-context">{chosenMode.title} · {categories.join(', ')}{goal.trim() ? ` · ${goal.trim()}` : ''}</p>
                <button className="btn btn-primary full" onClick={acceptMatch}>Preview mutually accepted chat <ArrowRight size={18}/></button><button className="btn btn-outline full" onClick={nextPerson}><Shuffle size={17}/> Try another match</button>
              </div>
              <p className="small-note"><LockKeyhole size={15}/> The live version will require acceptance from both real users.</p>
            </> : <div className="empty-results"><CircleHelp size={32}/><h2>No demo matches found</h2><p>Try another interest or reset any blocked profiles in your Skill Passport.</p><button className="btn btn-primary" onClick={() => navigate('interests')}>Edit interests</button></div>}
          </section>
  );
}
