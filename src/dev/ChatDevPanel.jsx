import { useEffect, useState } from 'react';
import { auth } from '../firebase.js';
import { MAX_MESSAGE_LENGTH, sendMessage, watchMessages } from '../services/chatService.js';

const button = { padding: '9px 14px', border: '1px solid #777', borderRadius: 7, cursor: 'pointer' };

/** Developer-only chat panel, mounted ONLY inside an accepted match. */
export default function ChatDevPanel({ matchId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('Connecting to live messages…');
  const [sending, setSending] = useState(false);
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
    <h4>Live text chat (approved testers only)</h4>
    <p role="status" style={{ fontSize: 12 }}>{notice}</p>
    <div aria-live="polite" aria-label="Messages" style={{ background: '#f3f5f8', borderRadius: 8, padding: 12, minHeight: 100, maxHeight: 250, overflowY: 'auto' }}>
      {messages.length === 0 && <p>No messages yet. Say hello!</p>}
      {messages.map(msg => <p key={msg.id} style={{ overflowWrap: 'anywhere', margin: '8px 0' }}>
        <strong>{msg.senderId === myUid ? 'You' : 'Match'}:</strong> {' '}
        {msg.text}
      </p>)}
    </div>
    <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        aria-label="Message text"
        type="text"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Type a message…"
        style={{ flex: 1, minWidth: 0, padding: 9 }}
      />
      <button style={button} type="submit" disabled={sending || !draft.trim()}>Send</button>
    </form>
    <p style={{ fontSize: 12 }}>Use Leave or Next person above to close the match. Messages are stored in Firestore during this prototype.</p>
  </section>;
}
