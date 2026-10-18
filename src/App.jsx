import { useEffect, useState, useMemo } from 'react';
import { Menu, Flag, Ban, X, CheckCircle2 } from 'lucide-react';
import './App.css';
import './auth-pages.css'
import { canSaveActivity, recordSavedActivity } from './activityLogic.js';
import SkillCall from "./components/SkillCall";
import { getLiveKitToken } from "./livekitService";
import { PEOPLE, MODES, ACTIVITY_PROMPTS, EMPTY_PROGRESS, KEY, readDemo } from './data/demoData.js';
import { Logo } from './components/Shared.jsx';
import HomePage from './pages/HomePage.jsx';
import InterestsPage from './pages/InterestsPage.jsx';
import MatchingPage from './pages/MatchingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import SkillPassportPage from './pages/SkillPassportPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { logout, subscribeToAuth } from './services/authService.js';
import { updateMyCategories, getMyProfile } from './services/userService.js';
import { getMyQueue, joinQueue } from './services/matchingService.js';
import { auth } from './firebase.js';
import { combineCategories } from './services/categoryUtils.js';
import { CATEGORIES } from './data/demoData.js';
import LiveMatchingFlow from './pages/LiveMatchingFlow.jsx';


export default function App() {
  const [page, setPage] = useState('home');
  // Conversation state is independent of the currently visible main page.
  const [sessionPage, setSessionPage] = useState('matching');
  const [sessionQueueState, setSessionQueueState] = useState({ uid: null, queue: undefined });
  const [mobileNav, setMobileNav] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState('meet');
  const [categories, setCategories] = useState([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestsError, setInterestsError] = useState('');
  const [goal, setGoal] = useState('');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [lessonState, setLessonState] = useState('none'); // none > invited > active > completed
  const [activityType, setActivityType] = useState('explore');
  const [activityTopic, setActivityTopic] = useState('');
  const [lessonChecks, setLessonChecks] = useState([]);
  const [myConfirmation, setMyConfirmation] = useState(false);
  const [peerConfirmation, setPeerConfirmation] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate language');
  const [toast, setToast] = useState('');
  const [mobileChatTab, setMobileChatTab] = useState('chat');
  const [demoData, setDemoData] = useState(readDemo);
  const progress = demoData.progress;
  const blocked = demoData.blocked;
  const [activity, setActivity] = useState('') // share, getHelp, challenge, other
  const sessionQueue = sessionQueueState.uid === authUser?.uid ? sessionQueueState.queue : undefined;
  const activeSession = !!authUser && ['waiting', 'busy'].includes(sessionQueue?.status);
  const viewingSession = page === 'matching' || page === 'chat';

  useEffect(() => subscribeToAuth(currentUser => {
    setAuthUser(currentUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    let active = true;
    if (!authUser) { setCategories([]); setGoal(''); return undefined; }
    getMyProfile().then(profile => {
      if (!active || !profile) return;
      const presets = new Set(CATEGORIES.map(c => c.id));
      setCategories((profile.categories || []).filter(c => presets.has(c)));
      setGoal((profile.categories || []).filter(c => !presets.has(c)).join(', '));
    }).catch(err => { if (active) setInterestsError(err.message); });

    // A browser refresh resets React's route, not Firestore's queue or match.
    // Resume an opted-in search instead of making the user join twice.
    getMyQueue().then(existing => {
      if (!active) return;
      setSessionQueueState({ uid: authUser.uid, queue: existing });
      if (!existing || !['waiting', 'busy'].includes(existing.status)) return;
      // On reload, restore the server session. If the person was browsing Home
      // or Passport, keep that page visible and reconnect the chat behind it.
      let remembered = null;
      try { remembered = sessionStorage.getItem(`skillroulette-view:${authUser.uid}`); }
      catch { /* storage may be disabled */ }
      setPage(previous => previous === 'home'
        ? (remembered === 'home' || remembered === 'passport' ? remembered : 'matching')
        : previous);
    }).catch(err => { if (active) setInterestsError(err.message || String(err)); });
    return () => { active = false; };
  }, [authUser?.uid]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(demoData)); } catch { /* storage unavailable */ }
  }, [demoData]);

  const eligible = useMemo(() => PEOPLE.filter(person =>
    !blocked.includes(person.id) && (!categories.length || person.categories.some(c => categories.includes(c)))
  ).sort((a, b) => {
    if (mode !== 'help') return 0;
    const goalText = goal.toLowerCase();
    const score = person => person.expertise.some(skill => goalText.includes(skill.toLowerCase())) ? 1 : 0;
    return score(b) - score(a);
  }), [categories, blocked, mode, goal]);
  const candidate = eligible.length ? eligible[candidateIndex % eligible.length] : null;
  const chosenMode = MODES.find(m => m.id === mode);
  const isTeachingActivity = activityType === 'share' || activityType === 'ask';
  const teacherIsMe = activityType === 'share';
  const activityDefaults = {
    explore: `Explore something new about ${match?.categories[0] || 'a shared interest'}`,
    share: `Share a tip about ${match?.expertise[0] || 'a skill'}`,
    ask: `Get help with ${match?.expertise[0] || 'a skill'}`,
    challenge: `Try a short ${match?.categories[0] || 'skill'} challenge`,
  };
  const sessionGoal = activityTopic.trim() || goal.trim() || activityDefaults[activityType];
  const canSave = canSaveActivity({ status: lessonState, match, meAgreed: myConfirmation, peerAgreed: peerConfirmation });

  function navigate(next) {
    if (next === 'matching' || next === 'chat') setSessionPage(next);
    setPage(next);
    if (authUser?.uid) {
      try { sessionStorage.setItem(`skillroulette-view:${authUser.uid}`, next); }
      catch { /* storage may be disabled */ }
    }
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Match/chat transitions must not pull someone away from Home or Passport.
  // Firestore and chat listeners remain mounted while those pages are visible.
  function navigateWithinSession(next) {
    if (next !== 'matching' && next !== 'chat') { navigate(next); return; }
    setSessionPage(next);
    if (page === 'matching' || page === 'chat') navigate(next);
  }
  async function startMode(next) {
    setMode(next);
    if (!authUser) { navigate('interests'); return; }
    try {
      // Read the authoritative queue. This also covers matches created in
      // another browser tab that this tab has not seen yet.
      const existing = await getMyQueue();
      if (auth.currentUser?.uid !== authUser.uid) return;
      setSessionQueueState({ uid: authUser.uid, queue: existing });
      if (existing && ['waiting', 'busy'].includes(existing.status)) {
        navigate(sessionPage === 'chat' ? 'chat' : 'matching');
      } else {
        navigate('interests');
      }
    } catch (err) {
      setToast(`Could not check your current match: ${err.message || String(err)}`);
    }
  }
  async function handleLogout() {
    try {
      await logout();
      navigate('home');
    } catch {
      setToast('Could not log out. Please try again.');
    }
  }
  function toggleCategory(id) { setCategories(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); setCandidateIndex(0); }
  async function startSearch() {
    if (!authUser) { navigate('login'); return; }
    if (savingInterests) return;
    setInterestsError(''); setSavingInterests(true);
    try {
      // Don't overwrite saved interests while a pending/accepted match still
      // uses the older lobby selection. Resume that search instead.
      const existing = await getMyQueue();
      if (existing) {
        setToast('Resuming your existing search or match. Use Edit interests to leave it before changing interests.');
        navigate('matching');
        return;
      }

      const combined = combineCategories(categories, goal);
      await updateMyCategories(combined);
      try {
        await joinQueue(combined);
      } catch (err) {
        // A competing browser may have joined/been matched in the meantime.
        // Preserve the match and let the live page display its actual state.
        if ((await getMyQueue())?.status === 'busy') {
          setToast('A match is already in progress. Resuming it.');
          navigate('matching');
          return;
        }
        throw err;
      }
      navigate('matching');
    } catch (err) { setInterestsError(err.message || String(err)); }
    finally { setSavingInterests(false); }
  }
  function clearLesson() {
    setLessonState('none'); setActivityType('explore'); setActivityTopic(''); setLessonChecks([]);
    setMyConfirmation(false); setPeerConfirmation(false); setRating(0);
    setReview(''); setReviewSubmitted(false); setMobileChatTab('chat');
  }
  function stopActivity() {
    const alreadySaved = lessonState === 'completed';
    clearLesson();
    setToast(alreadySaved ? 'Back to chat. Your saved experience remains in the Passport.' : 'Activity ended. Nothing was added to your Skill Passport.');
  }
  function endConversation(destination) {
    clearLesson(); setMatch(null); setMessages([]); setDraft(''); setReportOpen(false);
    if (destination === 'matching') {
      setCandidateIndex(old => old + 1);
      navigate('matching');
    } else {
      navigate('home');
    }
  }
  function leaveChat() { endConversation('home'); }
  function nextPerson() { endConversation('matching'); }
  function acceptMatch() {
    if (!candidate) return;
    clearLesson();
    setMatch(candidate);
    setMessages([{ id: 'welcome', who: 'them', body: candidate.intro, time: 'Just now' }]);
    navigate('chat');
  }
  function sendMessage(e) {
    e.preventDefault();
    const text = draft.trim().slice(0, 600);
    if (!text || !match) return;
    setMessages(old => [...old, { id: `me-${Date.now()}-${old.length}`, who: 'me', body: text, time: 'Now' }]);
    setDraft('');
  }
  function simulateReply() {
    const replies = ["That sounds great! Tell me a little more.", "I can help with that. Want to try a short practice session?", "Nice! We can take it one step at a time.", "That's interesting. What would you like to learn first?"];
    setMessages(old => [...old, { id: `reply-${Date.now()}-${old.length}`, who: 'them', body: replies[old.length % replies.length], time: 'Now' }]);
  }
  function selectActivity(type) {
    setActivityType(type); setActivityTopic('');
    setLessonChecks([]); setMyConfirmation(false); setPeerConfirmation(false);
  }
  function inviteLesson() {
    setLessonChecks(ACTIVITY_PROMPTS[activityType].map(() => false));
    setMyConfirmation(false); setPeerConfirmation(false);
    setLessonState('invited'); setMobileChatTab('lesson');
  }
  function confirmInviteA() { setLessonState('desc'); setMobileChatTab('lesson'); }
  function confirmInviteB() { setLessonState('active'); setMobileChatTab('lesson'); }
  function completeLesson() {
    // Saving is opt-in. Leaving, skipping and ending an activity never records progress.
    if (!canSave || !match || lessonState !== 'active') return;
    setLessonState('completed');
    setDemoData(old => {
      const progress = recordSavedActivity(old.progress, {
        match, activityType, goal: sessionGoal, id: `${Date.now()}-${match.id}`,
      });
      return { ...old, progress };
    });
    setToast('Experience saved to your local demo Skill Passport.');
  }
  function submitReview() {
    if (!match || !rating || reviewSubmitted || teacherIsMe || activityType !== 'ask' || lessonState !== 'completed') return;
    setReviewSubmitted(true);
    setDemoData(old => ({ ...old, progress: { ...old.progress, ratedSessions: [...old.progress.ratedSessions, { personId: match.id, rating, review: review.trim().slice(0, 300), id: Date.now() }] } }));
    setToast('Review saved to this browser demo.');
  }
  function reportUser(shouldBlock) {
    if (!match) return;
    if (shouldBlock) setDemoData(old => ({ ...old, blocked: [...new Set([...old.blocked, match.id])] }));
    setReportOpen(false);
    setToast(shouldBlock ? 'Demo profile blocked on this device.' : `Demo report noted: ${reportReason}.`);
    nextPerson();
  }
  function resetDemo() {
    setDemoData({ progress: { ...EMPTY_PROGRESS }, blocked: [] });
    setMatch(null); setCandidateIndex(0); setMessages([]); setDraft(''); clearLesson();
    setToast('Demo progress reset.'); navigate('home');
  }

  return (
  <div className="site-shell">
    <header className="site-header">
      <div className="header-inner wrap">
        <Logo onClick={() => navigate('home')} />
        <nav className={`desktop-nav ${mobileNav ? 'nav-open' : ''}`} aria-label="Main navigation">
          <button className={page === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}>Home</button>
          <button className={['interests', 'matching', 'chat'].includes(page) ? 'nav-active' : ''} onClick={() => startMode('meet')}>
            Find a match{activeSession && <span className="live-nav-indicator"> · {sessionPage === 'chat' ? 'In conversation' : 'Session active'}</span>}
          </button>
          <button className={page === 'passport' ? 'nav-active' : ''} onClick={() => navigate('passport')}>Skill Passport</button>
          {authReady && (authUser ? (
            <button onClick={handleLogout}>Log out</button>
          ) : <>
            <button className={page === 'login' ? 'nav-active' : ''} onClick={() => navigate('login')}>Log in</button>
            <button className={page === 'sign in' ? 'nav-active' : ''} onClick={() => navigate('sign in')}>Sign up</button>
          </>)}
        </nav>
        <div className="header-actions"><button className="avatar-button" onClick={() => navigate(authUser ? 'passport' : 'login')} aria-label={authUser ? 'Open your Skill Passport' : 'Log in'}><span className="avatar avatar--xs avatar--blue">{authUser ? (authUser.displayName || authUser.email || 'You').slice(0, 2).toUpperCase() : 'YOU'}</span></button><button className="menu-button" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Menu size={22}/></button></div>
      </div>
    </header>

    <main>
      {page === 'home' && <HomePage navigate={navigate} startMode={startMode} />}
      {page === 'interests' && <InterestsPage chosenMode={chosenMode} categories={categories} toggleCategory={toggleCategory}
          goal={goal} setGoal={setGoal} mode={mode} startSearch={startSearch} navigate={navigate}
          saving={savingInterests} error={interestsError}
          count={new Set([...categories, ...goal.split(',').map(v => v.trim().toLowerCase()).filter(Boolean)]).size} />}
      {authUser && (activeSession || viewingSession) && (
        <div className="persistent-session" hidden={!viewingSession}>
          <LiveMatchingFlow key={authUser.uid} page={sessionPage}
            categories={[...categories, ...goal.split(',').map(v => v.trim()).filter(Boolean)]}
            navigate={navigateWithinSession}
            onQueueChange={queue => setSessionQueueState({ uid: authUser.uid, queue })} />
        </div>
      )}
      {page === 'review' && match && <ReviewPage {...{match,navigate,activityType,reviewSubmitted,rating,setRating,review,setReview,
          submitReview,stopActivity,leaveChat,teacherIsMe,lessonState}} />}
      {page === 'passport' && <SkillPassportPage progress={progress} startMode={startMode} resetDemo={resetDemo} />}
      {page === 'login' && <LoginPage navigate={navigate} />}
      {page === 'sign in' && <SignUpPage navigate={navigate} />}
    </main>
    <footer className="site-footer"><div className="wrap footer-inner"><span><strong>Skill Roulette</strong> · Meet. Discover. Share.</span><span>Hackathon prototype · Firebase test accounts</span></div></footer>

    {reportOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setReportOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="report-title" className="report-modal"><div className="modal-heading"><h2 id="report-title">Report or block {match?.name}</h2><button aria-label="Close report dialog" onClick={() => setReportOpen(false)}><X size={20}/></button></div><p>During this demo, reports are only recorded as a local confirmation. A public platform would need a real moderation service.</p><label htmlFor="reason">Reason for reporting</label><select id="reason" value={reportReason} onChange={e => setReportReason(e.target.value)}><option>Inappropriate language</option><option>Bullying or harassment</option><option>Unwanted contact information</option><option>Other concern</option></select><button className="btn btn-outline full" onClick={() => reportUser(false)}><Flag size={17}/> Submit demo report</button><button className="btn btn-danger full" onClick={() => reportUser(true)}><Ban size={17}/> Block this demo profile</button></div></div>}
    {toast && <div role="status" className="toast"><CheckCircle2 size={17}/>{toast}<button aria-label="Dismiss message" onClick={() => setToast('')}><X size={16}/></button></div>}
  </div>
  );
}