import { useEffect, useRef } from 'react';
import { ArrowLeft, CircleHelp, LockKeyhole, MessageCircle, X } from 'lucide-react';
import { StageTag } from '../components/Shared.jsx';
import { CATEGORIES } from '../data/demoData.js';
import './MatchingPage.css';

// This component handles presentation only. Firestore state and all match
// actions are provided by LiveMatchingFlow, not simulated here.
const toChip = id => CATEGORIES.find(c => c.id === id) ?? { id, label: id };

export default function MatchingPage({
  categories = [],
  chosenMode,
  queue,
  pending,
  accepted,
  peerName,
  seconds,
  alreadyAccepted,
  autoStatus,
  busy,
  error,
  onEditInterests,
  onCancel,
  onStartSearch,
  onAccept,
  onDecline,
  onOpenChat,
}) {
  const dialogRef = useRef(null);
  const acceptButtonRef = useRef(null);
  const declineButtonRef = useRef(null);
  const selected = [...new Map(categories.map(id => [id.toLowerCase(), toChip(id)])).values()];
  const sharedChip = pending?.category ? toChip(pending.category) : null;
  const searching = queue?.status === 'waiting';
  const findingProposal = queue?.status === 'busy' && !pending && !accepted;
  const loading = queue === undefined;

  useEffect(() => {
    if (pending?.id) {
      (alreadyAccepted ? declineButtonRef : acceptButtonRef).current?.focus();
    }
  }, [pending?.id, alreadyAccepted]);

  // Keep keyboard focus within the real invitation while it is open.
  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) onDecline();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])];
    if (!buttons.length) return;
    if (event.shiftKey && document.activeElement === buttons[0]) {
      event.preventDefault();
      buttons[buttons.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
      event.preventDefault();
      buttons[0].focus();
    }
  }

  return (
    <section className="flow-page wrap narrow-flow matching-page">
      <div className="backline">
        <button type="button" className="back-button" disabled={busy} onClick={onEditInterests}>
          <ArrowLeft size={17}/> Edit interests
        </button>
        <div className="step-label">Step 2 of 2</div>
      </div>
      <div className="progress-steps" aria-hidden="true">
        <span className="step-current"/><span className="step-current"/><span/>
      </div>

      <div className="flow-title">
        <StageTag kind="green"><span className="little-dot"/> {pending ? 'Match found' : accepted ? 'Connected' : 'Searching'}</StageTag>
        <h1>Finding your match</h1>
        <p>Hang tight while we look for someone who shares your interests.</p>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="match-preview searching-card">
        <p className="sr-only" role="status">
          {accepted ? 'Match accepted' : pending ? `Invitation from ${peerName}` : 'Searching for a match…'}
        </p>
        <div className="search-pulse" aria-hidden="true">
          <span className="avatar avatar--xl avatar--blue">YOU</span>
        </div>

        <h2 className="search-heading">{chosenMode?.title || 'Meet people with shared interests'}</h2>
        <p className="search-label">Your interests</p>
        <ul className="search-tags">
          {selected.map(({ id, label, Icon }) => (
            <li key={id}>{Icon && <Icon size={15}/>} {label}</li>
          ))}
        </ul>

        {accepted ? (
          <>
            <p className="search-goal">You matched with <strong>{peerName}</strong> through {accepted.category}.</p>
            <button type="button" className="btn btn-primary full" onClick={onOpenChat}>
              <MessageCircle size={17}/> Open chat
            </button>
          </>
        ) : searching || pending || findingProposal || loading ? (
          <>
            <p className="search-goal" role="status">
              {pending
                ? 'Match invitation received. Both people must accept.'
                : findingProposal
                  ? 'Connecting you with someone who shares an interest…'
                  : loading
                    ? 'Restoring your matchmaking session…'
                    : autoStatus || 'Looking for someone with a shared interest…'}
            </p>
            <button type="button" className="btn btn-outline full" disabled={busy} onClick={onCancel}>
              <X size={17}/> Cancel
            </button>
          </>
        ) : (
          <>
            <p className="search-goal"><CircleHelp size={16}/> Not searching yet. Start searching to meet someone.</p>
            <button type="button" className="btn btn-primary full" disabled={busy || !categories.length} onClick={onStartSearch}>
              Start searching
            </button>
          </>
        )}
      </div>

      <p className="small-note"><LockKeyhole size={15}/> Both people must accept before a conversation starts. Invitations expire after 60 seconds.</p>

      {pending && (
        <div className="modal-backdrop" role="presentation">
          <div ref={dialogRef} className="match-modal" role="dialog" aria-modal="true"
            aria-labelledby="match-modal-title" onKeyDown={handleDialogKeyDown}>
            <span className="avatar avatar--xl avatar--blue" aria-hidden="true">{peerName.slice(0, 2).toUpperCase()}</span>
            <h2 id="match-modal-title">It's a match!</h2>
            <p className="match-modal-text">You and {peerName} share an interest. Want to start chatting?</p>

            <p className="search-label">Shared interest</p>
            <ul className="search-tags">
              {sharedChip && <li key={sharedChip.id}>
                {sharedChip.Icon && <sharedChip.Icon size={15}/>} {sharedChip.label}
              </li>}
            </ul>
            <p className="search-goal" role="status">
              {seconds === null ? 'Preparing timer…' : `${seconds} seconds left to accept`}
            </p>
            {alreadyAccepted && <p className="match-modal-text">You accepted. Waiting for {peerName}…</p>}
            <div className="match-actions">
              <button ref={declineButtonRef} type="button" className="btn btn-outline btn-decline"
                disabled={busy} onClick={onDecline}>Decline</button>
              {!alreadyAccepted && <button ref={acceptButtonRef} type="button" className="btn btn-primary"
                disabled={busy || seconds === 0} onClick={onAccept}>Accept</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
