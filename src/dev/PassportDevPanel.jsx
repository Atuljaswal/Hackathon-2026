import { useEffect, useState } from 'react';
import { deleteExperience, watchMyPassport } from '../services/passportService.js';

const names = { explore: 'Explored', share: 'Shared a skill', ask: 'Asked for help', challenge: 'Challenged' };
const button = { border: '1px solid #aab3bd', borderRadius: 7, padding: '7px 11px', cursor: 'pointer' };

// Developer-only version of the Passport page; available even when not matched.
export default function PassportDevPanel() {
  const [entries, setEntries] = useState([]);
  const [notice, setNotice] = useState('Loading saved experiences…');
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (notice !== 'Experience removed from your Passport.') {
      return;
    }

    const timer = setTimeout(() => {
      setNotice('');
    }, 4000);

    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => watchMyPassport(
    items => { setEntries(items); setNotice(''); },
    error => setNotice(`Passport read failed: ${error.code || error.message}`),
  ), []);

  async function remove(entry) {
    if (!window.confirm(`Remove “${entry.topic}” from your Skill Passport?`)) return;
    setRemoving(entry.id);
    try {
      await deleteExperience(entry.id);
      setNotice('Experience removed from your Passport.');
    } catch (error) {
      setNotice(`Could not remove experience: ${error.code || error.message}`);
    } finally {
      setRemoving(null);
    }
  }

  return <section aria-label="My Skill Passport" style={{ border: '1px solid #bac5d1', borderRadius: 10, padding: 14, marginTop: 16 }}>
    <h3>My Skill Passport (developer test)</h3>
    <p style={{ fontSize: 13 }}>Only you can view and delete these personal experience entries. Saving is optional; entries are not skill endorsements.</p>
    {notice && <p role="status">{notice}</p>}
    {!entries.length && <p>No experiences saved yet.</p>}
    {entries.map(entry => <article key={entry.id} style={{ padding: 12, border: '1px solid #e0e4e8', borderRadius: 8, marginBottom: 10 }}>
      <strong>{names[entry.type] || entry.type}: {entry.topic}</strong>
      <p style={{ fontSize: 12, margin: '5px 0', color: '#667085' }}>
        With {entry.partnerDisplayName || 'a matched member'} · Saved {entry.savedAt?.toDate?.().toLocaleDateString() || 'just now'}
      </p>
      <button type="button" style={button} disabled={removing === entry.id} onClick={() => remove(entry)}>
        {removing === entry.id ? 'Removing…' : 'Delete experience'}
      </button>
    </article>)}
  </section>;
}
