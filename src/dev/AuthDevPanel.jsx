import { useEffect, useState } from 'react';
import { signUp, login, logout, subscribeToAuth } from '../services/authService.js';
import { getMyProfile, updateMySkills } from '../services/userService.js';

const fieldStyle = { display: 'block', width: '100%', padding: 9, border: '1px solid #bbb', borderRadius: 8 };
const buttonStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid #777', cursor: 'pointer' };
const split = (value) => value.split(',').map(x => x.trim()).filter(Boolean);

/** Local development only. main.jsx exposes at ?auth-test=1 during npm run dev. */
export default function AuthDevPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState('Music,Gaming');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Waiting for Firebase authentication...');

  useEffect(() => subscribeToAuth(async current => {
    setUser(current);
    if (!current) {
      setProfile(null);
      setNotice('Signed out. Create an account or log in.');
      return;
    }
    try {
      const currentProfile = await getMyProfile();
      setProfile(currentProfile);
      setNotice(`Signed in as ${current.email}`);
    } catch (error) {
      setNotice(`Signed in, but Firestore profile read failed: ${error.message}`);
    }
  }), []);

  async function run(label, action) {
    setBusy(true);
    setNotice(`${label}...`);
    try {
      await action();
      setProfile(await getMyProfile().catch(() => null));
      setNotice(`${label} succeeded.`);
    } catch (error) {
      setNotice(`${label} failed: ${error.code || error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 680, margin: '32px auto', padding: 24, color: '#1c2736', background: '#fff' }}>
    <h1>Skill Roulette · Firebase backend test</h1>
    <p>This temporary page is for developers only. Your normal website design is unchanged.</p>
    <p><strong>Status:</strong> {notice}</p>
    <label style={{ display: 'block', marginBottom: 12 }}>Display name
      <input style={fieldStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Example: Alex" />
    </label>
    <label style={{ display: 'block', marginBottom: 12 }}>Email
      <input style={fieldStyle} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
    </label>
    <label style={{ display: 'block', marginBottom: 12 }}>Password
      <input style={fieldStyle} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
    </label>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button style={buttonStyle} disabled={busy || !!user} onClick={() => run('Sign up', () => signUp(email, password, displayName))}>Sign up</button>
      <button style={buttonStyle} disabled={busy || !!user} onClick={() => run('Login', () => login(email, password))}>Log in</button>
      <button style={buttonStyle} disabled={busy || !user} onClick={() => run('Logout', logout)}>Log out</button>
      <button style={buttonStyle} disabled={busy || !user} onClick={() => run('Refresh profile', async () => {})}>Refresh profile</button>
    </div>
    {user && <section style={{ marginTop: 24 }}>
      <h2>Private user profile</h2>
      <pre style={{ padding: 14, borderRadius: 8, background: '#f2f4f7', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(profile, null, 2)}</pre>
      <label style={{ display: 'block', marginBottom: 12 }}>Categories (comma-separated)
        <input style={fieldStyle} value={skills} onChange={e => setSkills(e.target.value)} />
      </label>
      <button style={buttonStyle} disabled={busy} onClick={() => run('Save interests', () => updateMySkills({ categories: split(skills), canTeach: [], wantsToLearn: [] }))}>Save interests</button>
    </section>}
    <p style={{ marginTop: 24, fontSize: 13, color: '#555' }}>Never use this developer page to collect real users' credentials. For controlled local testing only.</p>
  </main>;
}
