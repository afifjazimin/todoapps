import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, authReady } = useAuth();

  if (!authReady) {
    return children;
  }

  if (loading) {
    return (
      <div className="auth-status">
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
