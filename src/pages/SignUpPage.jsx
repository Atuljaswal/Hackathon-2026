import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { signUp } from '../services/authService.js';
import { authErrorMessage } from '../utils/authErrorMessage.js';

export default function SignUpPage({ navigate }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const name = displayName.trim();
    if (name.length < 2 || name.length > 40) {
      setError('Display name must be between 2 and 40 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password, name);
      setPassword('');
      setConfirmPassword('');
      navigate('home');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" aria-labelledby="signup-heading">
      <div className="auth-card">
        <h1 id="signup-heading" className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join Skill Roulette to meet, discover, and share.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Display name</label>
            <input id="signup-name" name="displayName" type="text" className="auth-input"
              placeholder="Choose a display name" autoComplete="nickname" required
              minLength={2} maxLength={40} value={displayName}
              onChange={(event) => setDisplayName(event.target.value)} disabled={busy} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" className="auth-input"
              placeholder="Enter your email" autoComplete="email" required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" name="password" type="password" className="auth-input"
              placeholder="Create a password" autoComplete="new-password" required minLength={6}
              value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input id="signup-confirm" name="confirmPassword" type="password" className="auth-input"
              placeholder="Enter your password again" autoComplete="new-password" required minLength={6}
              value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={busy} />
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'} {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">Already have an account?{' '}
          <button type="button" onClick={() => navigate('login')}>Log in</button>
        </p>
      </div>
    </section>
  );
}
