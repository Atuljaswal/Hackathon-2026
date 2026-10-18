import { LockKeyhole, ArrowRight } from "lucide-react";
export default function LoginPage({navigate}) {
  return (
  <section className="auth-page" aria-labelledby="login-heading">
    <div className="auth-card">
      <span className="auth-mark" aria-hidden="true"><LockKeyhole size={24} /></span>
      <h1 id="login-heading" className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Log in to continue your Skill Roulette journey.</p>

      {/* Layout only: connect this form to Firebase Authentication later. */}
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-field">
          <label htmlFor="login-username">Username</label>
          <input id="login-username" name="username" type="text" className="auth-input"
            placeholder="Enter your username" autoComplete="username" required />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" className="auth-input"
            placeholder="Enter your password" autoComplete="current-password" required />
        </div>
        <button className="auth-submit" type="submit">Log in <ArrowRight size={18} /></button>
      </form>

      <p className="auth-switch">New to Skill Roulette?{' '}
        <button type="button" onClick={() => navigate('sign in')}>Create an account</button>
      </p>
    </div>
  </section>
  );
}
