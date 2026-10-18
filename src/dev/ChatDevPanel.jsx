import { useEffect, useRef, useState } from 'react';
import { auth } from '../firebase.js';
import { MAX_MESSAGE_LENGTH, sendMessage, watchMessages } from '../services/chatService.js';

const button = { padding: '9px 14px', border: '1px solid #777', borderRadius: 7, cursor: 'pointer' };

function messageTime(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Developer-only chat panel, mounted ONLY inside an accepted match. */
export default function ChatDevPanel({ matchId, peerName = 'Matched member' }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('Connecting to live messages…');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    setMessages([]);
    setDraft('');
    setNotice('Connecting to live messages…');
    const unsubscribe = watchMessages(
      matchId,
      setMessages,
      error => setNotice(`Message listener failed: ${error.code || error.message}`),
    );
    setNotice('Live chat ready.');
    return unsubscribe;
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(matchId, draft);
      setDraft('');
      setNotice('Message sent.');
    } catch (error) {
      setNotice(`Send failed: ${error.code || error.message}`);
    } finally {
      setSending(false);
    }
  }

  return <section aria-label="Live chat testing" style={{ border: '1px solid #b9c4d0', borderRadius: 10, padding: 14, marginTop: 14 }}>
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h4 style={{ margin: '0 0 4px' }}>Chat with {peerName}</h4>
        <small style={{ color: '#4a6476' }}>Connected · Text chat</small>
      </div>
    </header>
    <p role="status" style={{ fontSize: 12 }}>{notice}</p>
    <div aria-live="polite" aria-label="Messages" style={{ background: '#f3f5f8', borderRadius: 8, padding: 12, minHeight: 180, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {messages.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No messages yet. Say hello!</p>}
      {messages.map(msg => {
        const mine = msg.senderId === myUid;
        return <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
          <div style={{ maxWidth: '78%', minWidth: 65, padding: '9px 12px', borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, background: mine ? '#d8edff' : '#fff', color: '#182c3c', boxShadow: '0 1px 3px #00000012', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#39566a' }}>{mine ? 'You' : peerName}</div>
            <div>{msg.text}</div>
            <div style={{ fontSize: 10, textAlign: 'right', marginTop: 5, color: '#64748b' }}>{messageTime(msg.createdAt)}</div>
          </div>
        </div>;
      })}
      <div ref={bottomRef} />
    </div>
    <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        aria-label="Message text"
        type="text"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={`Message ${peerName}…`}
        style={{ flex: 1, minWidth: 0, padding: 9, borderRadius: 8, border: '1px solid #bac7d4' }}
      />
      <button style={button} type="submit" disabled={sending || !draft.trim()}>Send</button>
    </form>
    <p style={{ fontSize: 12 }}>Use Leave or Next person to close the match. Messages are stored in Firestore during this prototype.</p>
  </section>;
}
