// src/routes/ProtectedRoute.jsx
// Route guard for authenticated and role-based routes

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (user?.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
    if (user?.role === 'admin')  return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
