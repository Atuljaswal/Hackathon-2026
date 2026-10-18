// import { useEffect, useMemo, useState } from 'react';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle2,
  Clock3, Compass, Flag, Gamepad2, GraduationCap, HeartHandshake, Languages,
  Menu, MessageCircle, Music2, Palette, RotateCcw, Send, ShieldCheck,
  Shuffle, Sparkles, Star, Users, X, Code2, Ellipsis, CircleHelp,
  Ban, Trophy, ArrowLeftRight, LockKeyhole, LogOut, SkipForward, Lightbulb
} from 'lucide-react';
import './App.css';
import { canSaveActivity, recordSavedActivity } from './activityLogic.js';
import CameraView from './Camera.jsx'

const CATEGORIES = [
  { id: 'Languages', label: 'Languages', Icon: Languages },
  { id: 'Music', label: 'Music', Icon: Music2 },
  { id: 'Gaming', label: 'Gaming', Icon: Gamepad2 },
  { id: 'Programming', label: 'Programming', Icon: Code2 },
  { id: 'Design', label: 'Art & design', Icon: Palette },
  { id: 'Other', label: 'Other skills', Icon: Ellipsis },
];

const MODES = [
  { id: 'meet', title: 'Meet someone', description: 'Find people with similar interests and chat freely.', Icon: Users, tone: 'blue' },
  { id: 'help', title: 'Get quick help', description: 'Find someone who can share a tip or practice with you.', Icon: HeartHandshake, tone: 'green' },
  { id: 'teach', title: 'Share or swap', description: 'Offer a skill, trade tips, or discover something together.', Icon: ArrowLeftRight, tone: 'amber' },
];

// Activities are invitations within casual chat, never prerequisites for leaving.
const ACTIVITIES = [
  { id: 'explore', title: 'Explore together', description: 'Discover something new through conversation.', Icon: Compass },
  { id: 'share', title: 'Share a skill', description: 'Show someone a trick, tip, or technique.', Icon: Lightbulb },
  { id: 'ask', title: 'Ask for help', description: 'Get a little help without booking a lesson.', Icon: BookOpen },
  { id: 'challenge', title: 'Try a challenge', description: 'Choose a small, fun activity to attempt together.', Icon: Trophy },
];

const ACTIVITY_PROMPTS = {
  explore: ['Share an interesting fact or hobby', 'Ask each other a question', 'Try a new idea together'],
  share: ['Share one useful tip', 'Let your partner try or ask questions', 'Discuss what worked'],
  ask: ['Explain what you need help with', 'Try one suggestion', 'Ask follow-up questions'],
  challenge: ['Pick a tiny challenge', 'Give it a try', 'Share what happened'],
};

// Fictional, approved demo profiles. These are never fetched from strangers online.
const PEOPLE = [
  { id: 'ava', name: 'Ava', initials: 'AV', categories: ['Languages', 'Music'], expertise: ['Spanish', 'English'], learning: ['Guitar'], rating: 4.9, sessions: 35, helped: 27, hue: 'rose', intro: "Hi! I enjoy languages and music. What have you been into lately?", lesson: 'Learn five useful Spanish phrases', steps: ['Learn a greeting', 'Ask a simple question', 'Practice a polite response'], languages: 'Spanish / English' },
  { id: 'leo', name: 'Leo', initials: 'LE', categories: ['Music', 'Design'], expertise: ['Guitar', 'Music production'], learning: ['Japanese'], rating: 4.8, sessions: 51, helped: 39, hue: 'amber', intro: "Hey! I'm into guitar and making music. What have you been listening to?", lesson: 'Practice three beginner guitar chords', steps: ['Try your first chord', 'Practice changing chords', 'Play a short progression'], languages: 'English' },
  { id: 'sam', name: 'Sam', initials: 'SA', categories: ['Gaming', 'Programming'], expertise: ['Minecraft', 'Strategy games'], learning: ['Web design'], rating: 4.7, sessions: 20, helped: 15, hue: 'sky', intro: 'Hey! Nice to meet you. What games are you into?', lesson: 'Try one new Minecraft building technique', steps: ['Pick a small build', 'Try a new technique', 'Review the result'], languages: 'English' },
  { id: 'mina', name: 'Mina', initials: 'MI', categories: ['Languages', 'Design'], expertise: ['Japanese', 'Illustration'], learning: ['Piano'], rating: 4.9, sessions: 30, helped: 24, hue: 'violet', intro: 'Hello! We could practice Japanese or talk about illustration.', lesson: 'Practice a short Japanese introduction', steps: ['Say hello', 'Introduce yourself', 'Ask a follow-up question'], languages: 'Japanese / English' },
  { id: 'jules', name: 'Jules', initials: 'JU', categories: ['Design', 'Other'], expertise: ['Digital art', 'Photography'], learning: ['Python'], rating: 4.8, sessions: 18, helped: 14, hue: 'teal', intro: 'Hi! Do you want to talk about art, design or something totally new?', lesson: 'Learn one composition technique', steps: ['Choose a subject', 'Try a composition tip', 'Review your artwork'], languages: 'English' },
  { id: 'ari', name: 'Ari', initials: 'AR', categories: ['Programming', 'Other'], expertise: ['Python', 'React'], learning: ['French'], rating: 5.0, sessions: 22, helped: 16, hue: 'mint', intro: 'Hey! I enjoy helping with beginner coding questions.', lesson: 'Understand a simple Python function', steps: ['Explain the purpose', 'Read a short example', 'Write a tiny function'], languages: 'English' },
];

const EMPTY_PROGRESS = {
  sessionsCompleted: 0,
  taughtSessions: 0,
  peopleHelped: [],
  learnedCategories: [],
  ratedSessions: [],
  recentActivities: [],
};
const KEY = 'skill-roulette-light-demo-v1';
function readDemo() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      progress: { ...EMPTY_PROGRESS, ...(raw.progress || {}) },
      blocked: Array.isArray(raw.blocked) ? raw.blocked : [],
    };
  } catch {
    return { progress: { ...EMPTY_PROGRESS }, blocked: [] };
  }
}

function Avatar({ person, size = 'md', online = false }) {
  return <span className={`avatar avatar--${size} avatar--${person.hue || 'blue'}`} aria-label={`${person.name} avatar`}>
    {person.initials || person.name.slice(0, 2).toUpperCase()}
    {online && <span className="online-dot" />}
  </span>;
}
function Logo({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="Go to Skill Roulette homepage">
    <span className="brand-symbol"><Shuffle size={19} strokeWidth={2.6} /></span><span>Skill <b>Roulette</b></span>
  </button>;
}
function StageTag({ children, kind = 'blue' }) { return <span className={`status-tag status-tag--${kind}`}>{children}</span>; }
function Stars({ value, small = false }) {
  return <span className="stars"><Star size={small ? 13 : 17} fill="currentColor" /> <strong>{Number(value).toFixed(1)}</strong></span>;
}

function Camera() {
  const videoRef = useRef(null)
  const photoRef = useRef(null)

  const [hasPhoto, setHasPhoto] = useState(false)

  const getVideo = () => {
    navigator.mediaDevices.getUserMedia({
      video: {width: 1920, height: 1080}
    })
    .then(stream => {
      let video = videoRef.current;
      video.srcObject = stream;
      video.play();
    })
    .catch(err => {
      console.error(err);
    })
  }

  useEffect(() => {
    getVideo();
  }, [videoRef]);

  return (
  <div>
    <div className="camera">
      <video ref={videoRef}></video>
    </div>
    {/* <div className={'result' + (hasPhoto ? 'hasPhoto' : '')}>
      <canvas ref={photoRef}></canvas>
      <button>close</button>
    </div> */}
  </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home');
  const [mobileNav, setMobileNav] = useState(false);
  const [mode, setMode] = useState('meet');
  const [categories, setCategories] = useState(['Languages', 'Gaming']);
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

  function navigate(next) { setPage(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function startMode(next) { setMode(next); navigate('interests'); }
  function toggleCategory(id) { setCategories(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); setCandidateIndex(0); }
  function startSearch() { setCandidateIndex(0); navigate('matching'); }
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
          <button className={['interests', 'matching', 'chat'].includes(page) ? 'nav-active' : ''} onClick={() => startMode('meet')}>Find a match</button>
          <button className={page === 'passport' ? 'nav-active' : ''} onClick={() => navigate('passport')}>Skill Passport</button>
          <button className={page === 'login' ? 'nav-active' : ''} onClick={() => navigate('login')}>Login</button>
          <button className={page === 'sign in' ? 'nav-active' : ''} onClick={() => navigate('sign in')}>Sign In</button>
        </nav>
        <div className="header-actions"><button className="avatar-button" onClick={() => navigate('passport')} aria-label="Open your Skill Passport"><span className="avatar avatar--xs avatar--blue">YOU</span></button><button className="menu-button" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Menu size={22}/></button></div>
      </div>
    </header>

    <main>
      {page === 'home' && <>
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
      </>}

      {page === 'interests' && <section className="flow-page wrap narrow-flow">
        <div className="backline"><button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17}/> Back</button><div className="step-label">Step 1 of 2</div></div>
        <div className="progress-steps"><span className="step-current"/><span/><span/></div>
        <div className="flow-title"><StageTag>{chosenMode.title}</StageTag><h1>What are you interested in?</h1><p>Choose one or more categories to help us find a good match.</p></div>
        <div className="category-grid">{CATEGORIES.map(({ id, label, Icon }) => <button key={id} className={`category-tile ${categories.includes(id) ? 'selected' : ''}`} aria-pressed={categories.includes(id)} onClick={() => toggleCategory(id)}><span className="category-icon"><Icon size={23}/></span><strong>{label}</strong><span className="selection-indicator">{categories.includes(id) && <Check size={13} strokeWidth={3}/>}</span></button>)}</div>
        <label className="field-label" htmlFor="goal">{mode === 'meet' ? 'Anything you want to talk about?' : mode === 'help' ? 'What would you like help with?' : 'What would you like to share or explore?'  } <span>(optional)</span></label>
        <input id="goal" className="text-input" placeholder="e.g. Practice Japanese, learn guitar, play Minecraft" value={goal} onChange={e => setGoal(e.target.value.slice(0, 100))}/>
        <button className="btn btn-primary full" disabled={categories.length === 0} onClick={startSearch}>Continue <ArrowRight size={18}/></button>
        <p className="small-note"><ShieldCheck size={15}/> Only fictional demo profiles are used in this prototype.</p>
      </section>}

      {page === 'matching' && <section className="flow-page wrap narrow-flow matching-page">
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
      </section>}

      {page === 'chat' && match && <section className="chat-page wrap">
        <div className="chat-page-heading"><button className="back-button" onClick={leaveChat}><ArrowLeft size={17}/> Leave chat</button><div className="chat-heading-actions"><StageTag kind="green"><span className="little-dot"/> Simulated conversation</StageTag><button className="btn btn-outline chat-exit-button" onClick={leaveChat}><LogOut size={16}/> Leave conversation</button></div></div>
        <div className="chat-layout">
          <div>
            <Camera/> {/* other person */}
            <CameraView/> {/* self */}
          </div>
          
          <div className={`chat-column ${mobileChatTab === 'lesson' ? 'hide-on-mobile' : ''}`}>
            <div className="chat-person-bar"><div className="person-identity"><Avatar person={match} online/><div><h2>{match.name}</h2><p>{match.categories.join(' · ')}</p></div></div><div className="chat-toolbar"><button title="Next person (end this chat)" aria-label="Next person" onClick={nextPerson}><SkipForward size={18}/><span>Next person</span></button><button title="Report or block" aria-label="Report or block" onClick={() => setReportOpen(true)}><Flag size={18}/></button></div></div>
            <div className="chat-messages">
              <div className="chat-disclaimer"><ShieldCheck size={15}/> This is a simulated chat. No messages leave your device.</div>
              {messages.map(message => <div key={message.id} className={`message-line ${message.who === 'me' ? 'message-line--me' : ''}`}>{message.who === 'them' && <Avatar person={match} size="xs"/>}<div className={`message-bubble ${message.who === 'me' ? 'message-bubble--me' : ''}`}><p>{message.body}</p><span>{message.time}</span></div></div>)}
            </div>
            <div className="chat-bottom">
              <button className="demo-reply" onClick={simulateReply}><RotateCcw size={14}/> Simulate a reply from {match.name}</button>
              <form className="message-form" onSubmit={sendMessage}>
                <input aria-label="Message" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..." maxLength={600}/>
                <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Send size={19}/></button>
              </form>
            </div>
          </div>

          <div className={`lesson-column ${mobileChatTab === 'chat' ? 'hide-on-mobile' : ''}`}>
            <div className="lesson-header"><span className="lesson-icon"><Sparkles size={22}/></span><div><h2>Skill activities</h2><p>Optional experiences, not formal lessons.</p></div></div>
            {lessonState === 'none' &&
            <div className="lesson-content">
              <StageTag>optional</StageTag><h3>What activity would you like to try?</h3>
              <p className="lesson-summary">Keep chatting, or invite your match to explore something new.</p>
              <div className="activity-options" role="group" aria-label="Choose a skill activity">
                {ACTIVITIES.map(({ id, title, description, Icon }) => <button key={id} type="button" className={`activity-option ${activityType === id ? 'is-selected' : ''}`} aria-pressed={activityType === id} onClick={() => selectActivity(id)}><Icon size={18}/><span><strong>{title}</strong><small>{description}</small></span>{activityType === id && <CheckCircle2 size={17}/>}</button>)}
              </div>
              <label className="activity-topic-label" htmlFor="activity-topic">Activity idea <span>(optional)</span></label>
                <input id="activity-topic" className="text-input activity-topic-input" maxLength={100} placeholder={activityDefaults[activityType]} value={activityTopic} onChange={e => setActivityTopic(e.target.value)} />

              <div className="lesson-actions"><button className="btn btn-green full" onClick={inviteLesson}><Sparkles size={17}/> Invite to activity</button><button className="btn btn-outline full" onClick={() => setMobileChatTab('chat')}><MessageCircle size={16}/> Just keep chatting</button></div>
            </div>
            }
            {
              lessonState === 'invited' &&
              <div className="lesson-content">
                <StageTag kind="amber">Invitation preview</StageTag>
                <h3>{sessionGoal}</h3>
                <p>Activities start only when both people accept. For this browser-only demo, you can simulate the other person's acceptance.</p>
                <button className="btn btn-green full" onClick={confirmInviteB}><Check size={17}/> Simulate both accepting</button>
                <button className="btn btn-outline full" onClick={stopActivity}>Cancel invitation · Return to chat</button>
              </div>
            }
            {
              lessonState === 'active' && 
              <div className="lesson-content"><StageTag kind="green"><span className="little-dot"/> Activity in progress</StageTag><h3>{sessionGoal}</h3><p>These ideas are optional. You can stop or go back to casual chat at any time.</p><div className="lesson-checklist">{ACTIVITY_PROMPTS[activityType].map((step, index) => <label key={step} className={lessonChecks[index] ? 'task-done' : ''}><input type="checkbox" checked={lessonChecks[index] || false} onChange={e => setLessonChecks(old => old.map((v, i) => index === i ? e.target.checked : v))}/>{step}</label>)}</div><div className="session-confirmations"><strong>Save to Skill Passport? <span>(optional)</span></strong><p>Only save an experience if both participants choose to record it. Checkboxes above are never required.</p><label><input type="checkbox" checked={myConfirmation} onChange={e => setMyConfirmation(e.target.checked)}/> I'd like to save this experience</label><label><input type="checkbox" checked={peerConfirmation} onChange={e => setPeerConfirmation(e.target.checked)}/> Simulate {match.name} agreeing to save</label><button className="btn btn-green full" onClick={completeLesson} disabled={!canSave}><BookOpen size={17}/> Save experience (optional)</button></div><button className="btn btn-outline full" onClick={stopActivity}><MessageCircle size={16}/> Stop activity · Return to chat</button></div>}
            {
              lessonState === 'completed' &&
              <div className="lesson-content lesson-completed">
                <div className="success-circle"><Check size={29}/>
                </div>
                <h3>Experience saved!</h3>
                <p>This optional activity has been added to your local demo Skill Passport. You can continue chatting or leave at any time.</p>
                {isTeachingActivity && !teacherIsMe && <button className="btn btn-outline full" onClick={() => navigate('review')}>Rate helpfulness (optional) <ArrowRight size={18}/></button>}<button className="btn btn-primary full" onClick={stopActivity}><MessageCircle size={16}/> Return to chat</button><button className="btn btn-outline full" onClick={() => navigate('passport')}>View Skill Passport</button></div>}
            <div className="lesson-footer"><ShieldCheck size={16}/> Browser-only demo: no real person receives an invitation, and saved counts are not verified.</div>
          </div>
          
        </div>
        <div className="mobile-chat-switch"><button className={mobileChatTab === 'chat' ? 'selected' : ''} onClick={() => setMobileChatTab('chat')}><MessageCircle size={16}/> Chat</button><button className={mobileChatTab === 'lesson' ? 'selected' : ''} onClick={() => setMobileChatTab('lesson')}><Sparkles size={16}/> Activities</button></div>
      </section>}

      {page === 'review' && match && <section className="review-page wrap narrow-flow"><div className="backline"><button className="back-button" onClick={() => navigate('chat')}><ArrowLeft size={17}/> Back to conversation</button></div><div className="review-panel"><div className="success-circle"><Check size={30}/></div><h1>Optional feedback</h1><p>Want to rate the help you received from {match.name}? You can skip this entirely.</p>{activityType === 'ask' && !reviewSubmitted ? <><div className="rate-stars" aria-label="Choose a rating">{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star size={36} fill={n <= rating ? '#f7b84b' : 'none'} color={n <= rating ? '#f7b84b' : '#c7ced9'}/></button>)}</div><label className="sr-only" htmlFor="review-text">Optional review</label><textarea id="review-text" rows={4} maxLength={300} value={review} onChange={e => setReview(e.target.value)} placeholder="Leave a short review (optional)..."/><button className="btn btn-primary full" disabled={!rating} onClick={submitReview}>Submit review</button></> : <StageTag kind="green"><Check size={15}/> {reviewSubmitted ? 'Review saved locally' : 'Contribution recorded'}</StageTag>}<div className="review-passport"><BookOpen size={21}/><div><strong>Experience saved</strong><span>Feedback is not needed to keep it in your Passport.</span></div></div><button className="btn btn-primary full" onClick={() => { stopActivity(); navigate('chat'); }}><MessageCircle size={17}/> Skip feedback · Return to chat</button><button className="btn btn-outline full" onClick={leaveChat}><LogOut size={16}/> Leave conversation</button><button className="btn btn-subtle full" onClick={() => navigate('passport')}>Open Skill Passport <ArrowRight size={18}/></button></div></section>}

      {page === 'passport' && <section className="passport-page wrap"><div className="passport-heading"><div><span className="section-eyebrow">YOUR LEARNING JOURNEY</span><h1>Skill Passport</h1><p>A simple record of the things you've learned and shared.</p></div><button className="btn btn-primary" onClick={() => startMode('meet')}>Explore a skill <ArrowRight size={17}/></button></div><div className="passport-layout"><div className="passport-main"><div className="passport-profile"><Avatar person={{ name: 'You', initials: 'YOU', hue: 'blue' }} size="xl"/><div><h2>Your demo passport</h2><p>Curious learner · Helpful community member</p><StageTag kind="green"><ShieldCheck size={14}/> Private demo profile</StageTag></div></div><div className="passport-stat-grid"><div><BookOpen size={22}/><strong>{progress.sessionsCompleted}</strong><span>Experiences saved</span></div><div><HeartHandshake size={22}/><strong>{progress.peopleHelped.length}</strong><span>People helped</span></div><div><Compass size={22}/><strong>{progress.learnedCategories.length}</strong><span>Categories explored</span></div></div><div className="passport-subsection"><h3>Experiences you chose to save</h3>{progress.recentActivities.length ? <div className="activity-list">{progress.recentActivities.map(item => <div key={item.id}><span className="activity-icon"><Check size={17}/></span><div><strong>{item.role}: {item.skill}</strong><small>With {item.name} · Saved locally</small></div></div>)}</div> : <div className="empty-activity"><Sparkles size={20}/><span>No saved experiences yet. Chat freely, or choose to save an activity together.</span></div>}</div><div className="passport-subsection"><h3>Achievements</h3><div className="achievement-row">{progress.sessionsCompleted > 0 ? <span className="achievement"><Award size={17}/> First experience</span> : <span className="empty-tag">First experience — not earned yet</span>}{progress.taughtSessions > 0 && <span className="achievement"><GraduationCap size={17}/> Helpful teacher</span>}{progress.learnedCategories.length >= 2 && <span className="achievement"><Compass size={17}/> Skill explorer</span>}</div></div></div><aside className="passport-aside"><div className="aside-heading"><Trophy size={24}/><h3>Every skill counts</h3></div><p>Casual chat is enough. Save activities only when you and your match want to.</p>
      <div className="passport-aside-row"><Star size={19}/><span>{progress.ratedSessions.length} reviews given</span></div><div className="passport-aside-row"><GraduationCap size={19}/><span>{progress.taughtSessions} skill-sharing activities</span></div><div className="aside-notice"><LockKeyhole size={18}/> These numbers are stored locally and are not verified credentials.</div><button className="reset-link" onClick={resetDemo}><RotateCcw size={15}/> Reset demo progress and blocked profiles</button></aside></div></section>}
    
      {page === 'login' &&
      <section>
        <div>
            <h1>Login</h1>
            <div>
              <label>Username</label>
              <input type="text" className="userInput"/>
            </div>
            <div>
              <label>Password</label>
              <input type="text" className="userInput" name="pwdInput"/>
            </div>
            <button type="submit">Login</button>
        </div>
      </section>
      }
      {page === 'sign in' &&
      <section>
        <h1>Create an account</h1>
        <div>
          <label>Username</label>
          <input type="text" className="userInput" name="newUsername"/>
        </div>
        <div>
          <label>Password</label>
          <input type="text" className="userInput" name="newPwd"/>
        </div>
        <div>
          <label>Resubmit Password</label>
          <input type="text" className="userInput" name="newPwdClone"/>
        </div>
        <button type="submit">Login</button>
      </section>
      }
    </main>
    <footer className="site-footer"><div className="wrap footer-inner"><span><strong>Skill Roulette</strong> · Meet. Discover. Share.</span><span>Hackathon prototype · Simulated accounts only</span></div></footer>

    {reportOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setReportOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="report-title" className="report-modal"><div className="modal-heading"><h2 id="report-title">Report or block {match?.name}</h2><button aria-label="Close report dialog" onClick={() => setReportOpen(false)}><X size={20}/></button></div><p>During this demo, reports are only recorded as a local confirmation. A public platform would need a real moderation service.</p><label htmlFor="reason">Reason for reporting</label><select id="reason" value={reportReason} onChange={e => setReportReason(e.target.value)}><option>Inappropriate language</option><option>Bullying or harassment</option><option>Unwanted contact information</option><option>Other concern</option></select><button className="btn btn-outline full" onClick={() => reportUser(false)}><Flag size={17}/> Submit demo report</button><button className="btn btn-danger full" onClick={() => reportUser(true)}><Ban size={17}/> Block this demo profile</button></div></div>}
    {toast && <div role="status" className="toast"><CheckCircle2 size={17}/>{toast}<button aria-label="Dismiss message" onClick={() => setToast('')}><X size={16}/></button></div>}
  </div>
  );
}
