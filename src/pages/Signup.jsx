import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import '../styles/LandingPage.css';

export default function Signup() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Add your Supabase URL and anon key to .env first.');
      return;
    }

    setLoading(true);
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setMessage('Account created. Check your email if confirmation is enabled.');
  }

  async function handleGoogleLogin() {
    setError('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Add your Supabase URL and anon key to .env first.');
      return;
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <main className="modern-auth-container">
      <div className="dot-grid-bg"></div>

      <section className="modern-auth-card">
        <div className="modern-auth-logo">
          <div className="modern-auth-logo-dots">
            <span className="modern-auth-logo-dot blue"></span>
            <span className="modern-auth-logo-dot"></span>
            <span className="modern-auth-logo-dot"></span>
            <span className="modern-auth-logo-dot"></span>
          </div>
          <span className="modern-auth-brand-name">TodoApps</span>
        </div>

        <div className="modern-auth-header">
          <span className="modern-auth-kicker">New workspace</span>
          <h1>Create account</h1>
          <p>Your todos will be stored per user with Supabase row security.</p>
        </div>

        <form className="modern-auth-form" onSubmit={handleSignup}>
          {error && <div className="modern-auth-alert error">{error}</div>}
          {message && <div className="modern-auth-alert success">{message}</div>}
          <input
            type="email"
            value={email}
            placeholder="Email address"
            className="modern-auth-input"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            value={password}
            placeholder="Password"
            minLength={6}
            className="modern-auth-input"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="modern-auth-btn-primary" disabled={loading}>
            <FontAwesomeIcon icon={faUserPlus} />
            {loading ? 'Creating...' : 'Sign up'}
          </button>
        </form>

        <div className="modern-auth-divider">or</div>

        <button className="modern-auth-google-btn" type="button" onClick={handleGoogleLogin}>
          <FontAwesomeIcon icon={faGoogle} />
          Continue with Google
        </button>

        <p className="modern-auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
