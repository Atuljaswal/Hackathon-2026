import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bug, LockKeyhole, X } from 'lucide-react';
import { Avatar, StageTag } from '../components/Shared.jsx';
import { CATEGORIES } from '../data/demoData.js';

// Look up an interest id for its label and icon; fall back to the raw id.
const toChip = id => CATEGORIES.find(c => c.id === id) ?? { id, label: id };

export default function MatchingPage({ candidate, chosenMode, categories, goal, acceptMatch, nextPerson, navigate }) {
  const [matchFound, setMatchFound] = useState(false);
  const debugButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const acceptButtonRef = useRef(null);

  const selected = categories.map(toChip);
  const trimmedGoal = goal.trim();

  // Interests you and the match have in common (falls back to theirs if none are selected).
  const sharedIds = candidate ? candidate.categories.filter(c => categories.includes(c)) : [];
  const sharedChips = (sharedIds.length ? sharedIds : candidate?.categories ?? []).map(toChip);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (matchFound) acceptButtonRef.current?.focus();
  }, [matchFound]);

  function decline() {
    setMatchFound(false);
    nextPerson(); // moves on to the next candidate, so the next simulated match is someone new
    debugButtonRef.current?.focus();
  }

  // Escape declines; Tab stays inside the dialog.
  function handleDialogKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      decline();
      return;
    }
    if (e.key !== 'Tab') return;
    const buttons = dialogRef.current?.querySelectorAll('button');
    if (!buttons?.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <section className="flow-page wrap narrow-flow matching-page">
      <div className="backline">
        <button className="back-button" onClick={() => navigate('interests')}><ArrowLeft size={17}/> Edit interests</button>
        <div className="step-label">Step 2 of 2</div>
      </div>
      <div className="progress-steps"><span className="step-current"/><span className="step-current"/><span/></div>

      <div className="flow-title">
        <StageTag kind="green"><span className="little-dot"/> Searching</StageTag>
        <h1>Finding your match</h1>
        <p>Hang tight while we look for someone who shares your interests.</p>
      </div>

      <div className="match-preview searching-card">
        <p className="sr-only" role="status">Searching for a match…</p>

        <div className="search-pulse" aria-hidden="true">
          <span className="avatar avatar--xl avatar--blue">YOU</span>
        </div>

        {chosenMode && <h2 className="search-heading">{chosenMode.title}</h2>}

        <p className="search-label">Your interests</p>
        <ul className="search-tags">
          {selected.map(({ id, label, Icon }) => (
            <li key={id}>{Icon && <Icon size={15}/>}{label}</li>
          ))}
        </ul>

        {trimmedGoal && <p className="search-goal">Looking for: “{trimmedGoal}”</p>}

        <button type="button" className="btn btn-outline full" onClick={() => navigate('home')}>
          <X size={17}/> Cancel
        </button>
      </div>

      <p className="small-note"><LockKeyhole size={15}/> The live version will require acceptance from both real users.</p>

      {/* Debug only: remove (or gate behind your dev flag) once real matching exists. */}
      <div className="debug-tools">
        <span className="debug-label">Debug</span>
        <button
          ref={debugButtonRef}
          type="button"
          className="btn btn-subtle"
          disabled={!candidate}
          title={candidate ? undefined : 'No demo profiles match the selected interests'}
          onClick={() => setMatchFound(true)}
        >
          <Bug size={16}/> Simulate match
        </button>
      </div>

      {matchFound && candidate && (
        <div className="modal-backdrop" role="presentation">
          <div
            ref={dialogRef}
            className="match-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-modal-title"
            onKeyDown={handleDialogKeyDown}
          >
            <Avatar person={candidate} size="xl" online/>
            <h2 id="match-modal-title">It's a match!</h2>
            <p className="match-modal-text">You and {candidate.name} share some interests. Want to start chatting?</p>

            <p className="search-label">Shared interests</p>
            <ul className="search-tags">
              {sharedChips.map(({ id, label, Icon }) => (
                <li key={id}>{Icon && <Icon size={15}/>}{label}</li>
              ))}
            </ul>

            <div className="match-actions">
              <button type="button" className="btn btn-outline btn-decline" onClick={decline}>Decline</button>
              <button ref={acceptButtonRef} type="button" className="btn btn-primary" onClick={acceptMatch}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
