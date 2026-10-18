import { Sparkles, ArrowRight } from "lucide-react";
export default function SignUpPage({navigate}) {
  return (
    <section className="auth-page" aria-labelledby="signup-heading">
    <div className="auth-card">
      <h1 id="signup-heading" className="auth-title">Create an account</h1>
      <p className="auth-subtitle">Join Skill Roulette to meet, discover, and share.</p>

      {/* Layout only: connect this form to Firebase Authentication later. */}
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-field">
          <label htmlFor="signup-username">Username</label>
          <input id="signup-username" name="newUsername" type="text" className="auth-input"
            placeholder="Choose a username" autoComplete="username" required />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" name="newPwd" type="password" className="auth-input"
            placeholder="Create a password" autoComplete="new-password" required />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-confirm">Confirm password</label>
          <input id="signup-confirm" name="newPwdClone" type="password" className="auth-input"
            placeholder="Enter your password again" autoComplete="new-password" required />
        </div>
        <button className="auth-submit" type="submit">Create account <ArrowRight size={18} /></button>
      </form>

      <p className="auth-switch">Already have an account?{' '}
        <button type="button" onClick={() => navigate('login')}>Log in</button>
      </p>
    </div>
  </section>
  );
}
