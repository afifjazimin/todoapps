import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

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
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-copy">
          <span className="auth-kicker">New workspace</span>
          <h1>Create account</h1>
          <p>Your todos will be stored per user with Supabase row security.</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}
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
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            <FontAwesomeIcon icon={faUserPlus} />
            {loading ? 'Creating...' : 'Sign up'}
          </Button>
        </form>

        <Button className="auth-google" type="button" variant="secondary" onClick={handleGoogleLogin}>
          <FontAwesomeIcon icon={faGoogle} />
          Continue with Google
        </Button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
