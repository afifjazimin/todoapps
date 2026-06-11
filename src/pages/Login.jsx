import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

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
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-copy">
          <span className="auth-kicker">Todo credentials</span>
          <h1>Welcome back</h1>
          <p>Sign in to keep your tasks synced with your Supabase account.</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <p className="auth-error">{error}</p>}
          <Input
            type="email"
            value={email}
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            <FontAwesomeIcon icon={faArrowRightToBracket} />
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <Button className="auth-google" type="button" variant="secondary" onClick={handleGoogleLogin}>
          <FontAwesomeIcon icon={faGoogle} />
          Continue with Google
        </Button>

        <p className="auth-switch">
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
