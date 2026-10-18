import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Flag, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, LogOut, SkipForward } from 'lucide-react';
import { Avatar, StageTag } from '../components/Shared.jsx';
import { ACTIVITIES, ACTIVITY_PROMPTS } from '../data/demoData.js';
import CameraView from '../components/Camera.jsx'; // Preserve your existing Camera.jsx file.
import SkillCall from '../components/SkillCall.jsx';
import LiveActivitiesPanel from './LiveActivitiesPanel.jsx';
import MatchCallPanel from '../components/MatchCallPanel.jsx';

const CHAT_TABS = [
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
  { id: 'lesson', label: 'Activities', Icon: Sparkles },
];

function ChatTabs({ active, onChange }) {
  const tabRefs = useRef({});

  // const onKeyDown = (e, index) => {
  //   const last = CHAT_TABS.length - 1;
  //   let next = null;
  //   if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
  //   else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
  //   else if (e.key === 'Home') next = 0;
  //   else if (e.key === 'End') next = last;
  //   if (next === null) return;
  //   e.preventDefault();
  //   const id = CHAT_TABS[next].id;
  //   onChange(id);
  //   tabRefs.current[id]?.focus();
  // };

  return (
    <div className="chat-tablist" role="tablist" aria-label="Conversation sections">
      {CHAT_TABS.map(({ id, label, Icon }, index) => {
        const selected = active === id;
        return (
          <button
            key={id}
            ref={el => { tabRefs.current[id] = el; }}
            type="button"
            role="tab"
            id={`chat-tab-${id}`}
            aria-selected={selected}
            aria-controls={`chat-tabpanel-${id}`}
            tabIndex={selected ? 0 : -1}
            className={`chat-tab${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(id)}
            // onKeyDown={e => onKeyDown(e, index)}
          >
            <Icon size={16}/> {label}
          </button>
        );
      })}
    </div>
  );
}

// Both panels stay mounted (just hidden) so the message list keeps its scroll
// position and any half-typed draft or activity topic survives a tab switch.
function ChatTabPanel({ id, active, children }) {
  return (
    <div role="tabpanel" id={`chat-tabpanel-${id}`} aria-labelledby={`chat-tab-${id}`} className="chat-tabpanel" hidden={active !== id}>
      {children}
    </div>
  );
}

export default function ChatPage({ match, mobileChatTab = 'chat', leaveChat, nextPerson, setReportOpen, messages, simulateReply, draft, setDraft, sendMessage, lessonState, activityType, selectActivity, activityTopic, setActivityTopic, activityDefaults, inviteLesson, stopActivity, confirmInviteB, lessonChecks, setLessonChecks, myConfirmation, setMyConfirmation, peerConfirmation, setPeerConfirmation, canSave, completeLesson, isTeachingActivity, teacherIsMe, navigate, sessionGoal, setMobileChatTab, live = false, matchId, currentUid, callVisible = true, busy = false, inCall, livekitToken, startCall, endCall, serverUrl }) {
  const [liveTab, setLiveTab] = useState('chat');
  // Real Firebase chat and live Firestore activities share the same tab layout.
  if (live) return (
    <section className="chat-page wrap">
      <div className="chat-page-heading">
        <button className="back-button" disabled={busy} onClick={leaveChat}><ArrowLeft size={17}/> Leave chat</button>
        <div className="chat-heading-actions">
          <StageTag kind="green"><span className="little-dot"/> Real conversation</StageTag>
          <button className="btn btn-outline chat-exit-button" disabled={busy} onClick={leaveChat}><LogOut size={16}/> Leave conversation</button>
        </div>
      </div>
      <div className="chat-layout">
        {/* Call UI. The LiveKit engine is the useMatchCall hook; this panel is presentation only. */}
        <div className="live-video-stack">
          <MatchCallPanel
            key={matchId}
            matchId={matchId}
            peerUid={match.id}
            peerName={match.name}
            active={callVisible}
          />
        </div>
        <div className="chat-tabs">
          <ChatTabs active={liveTab} onChange={setLiveTab}/>
          <ChatTabPanel id="chat" active={liveTab}>
          <div className="chat-column">
            <div className="chat-person-bar">
              <div className="person-identity"><Avatar person={match} online/>
                <div><h2>{match.name}</h2><p>{match.categories.join(' · ')}</p></div>
              </div>
              <div className="chat-toolbar">
                <button disabled={busy} title="Find another person" onClick={nextPerson}><SkipForward size={18}/><span>Next person</span></button>
              </div>
            </div>
            <div className="chat-messages" aria-live="polite">
              <div className="chat-disclaimer"><ShieldCheck size={15}/> Only you and your accepted match can read these Firestore messages.</div>
              {messages.length ? messages.map(message => {
                const mine = message.senderId === currentUid;
                return <div key={message.id} className={`message-line ${mine ? 'message-line--me' : ''}`}>
                  {!mine && <Avatar person={match} size="xs"/>}
                  <div className={`message-bubble ${mine ? 'message-bubble--me' : ''}`}>
                    <p>{message.text}</p><span>{mine ? 'You' : match.name}</span>
                  </div>
                </div>;
              }) : <p className="small-note">No messages yet. Say hello when you're ready.</p>}
            </div>
            <div className="chat-bottom">
              <form className="message-form" onSubmit={sendMessage}>
                <input aria-label="Message" value={draft} onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message..." maxLength={1000}/>
                <button type="submit" aria-label="Send message" disabled={busy || !draft.trim()}><Send size={19}/></button>
              </form>
            </div>
          </div>
          </ChatTabPanel>
          <ChatTabPanel id="lesson" active={liveTab}>
            <LiveActivitiesPanel matchId={matchId} peerName={match.name} onBackToChat={() => setLiveTab('chat')}/>
          </ChatTabPanel>
        </div>
      </div>
    </section>
  );

  return (
    <section className="chat-page wrap">
            <div className="chat-page-heading"><button className="back-button" onClick={leaveChat}><ArrowLeft size={17}/> Leave chat</button><div className="chat-heading-actions"><StageTag kind="green"><span className="little-dot"/> Simulated conversation</StageTag><button className="btn btn-outline chat-exit-button" onClick={leaveChat}><LogOut size={16}/> Leave conversation</button></div></div>
            <div className="chat-layout">
              <div className="chat-video-area">
                {inCall && livekitToken ? (
                  <SkillCall
                    token={livekitToken}
                    serverUrl={serverUrl}
                    voiceOnly={false}
                    onLeave={endCall}
                  />
                ) : (
                  <div className="video-preview">
                    <CameraView autoStart={false} />

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => startCall(match.id)}
                      disabled={!match}
                    >
                      Start video call
                    </button>
                  </div>
                )}
            </div>

              <div className="chat-tabs">
                <ChatTabs active={mobileChatTab} onChange={setMobileChatTab}/>
                <ChatTabPanel id="chat" active={mobileChatTab}>
                  <div className="chat-column">
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
                </ChatTabPanel>
                <ChatTabPanel id="lesson" active={mobileChatTab}>
                  <div className="lesson-column">
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
                </ChatTabPanel>
              </div>
            </div>
          </section>
  );
}