import { useState } from 'react';
import { LockKeyhole, ArrowRight } from 'lucide-react';
import { login } from '../services/authService.js';
import { authErrorMessage } from '../utils/authErrorMessage.js';

export default function LoginPage({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      setPassword('');
      navigate('home');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" aria-labelledby="login-heading">
      <div className="auth-card">
        <span className="auth-mark" aria-hidden="true"><LockKeyhole size={24} /></span>
        <h1 id="login-heading" className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to continue your Skill Roulette journey.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" className="auth-input"
              placeholder="Enter your email" autoComplete="email" required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" className="auth-input"
              placeholder="Enter your password" autoComplete="current-password" required
              value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'} {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">New to Skill Roulette?{' '}
          <button type="button" onClick={() => navigate('sign in')}>Create an account</button>
        </p>
      </div>
    </section>
  );
}
