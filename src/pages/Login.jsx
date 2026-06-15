import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import '../styles/LandingPage.css';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Add your Supabase URL and anon key to .env first.');
      return;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate('/');
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
          <span className="modern-auth-kicker">Todo credentials</span>
          <h1>Welcome back</h1>
          <p>Sign in to keep your tasks synced with your Supabase account.</p>
        </div>

        <form className="modern-auth-form" onSubmit={handleLogin}>
          {error && <div className="modern-auth-alert error">{error}</div>}
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
            className="modern-auth-input"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="modern-auth-btn-primary" disabled={loading}>
            <FontAwesomeIcon icon={faArrowRightToBracket} />
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="modern-auth-divider">or</div>

        <button className="modern-auth-google-btn" type="button" onClick={handleGoogleLogin}>
          <FontAwesomeIcon icon={faGoogle} />
          Continue with Google
        </button>

        <p className="modern-auth-switch">
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
