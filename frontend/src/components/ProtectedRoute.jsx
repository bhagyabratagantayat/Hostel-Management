import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

/**
 * Route protection wrapper component.
 * @param {React.ReactNode} children - Component to render
 * @param {string[]} allowedRoles - List of roles permitted to view the page
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fullscreen-loading">
        <Loading message="Securing session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="forbidden-container">
        <div className="forbidden-card">
          <div className="forbidden-icon">🚫</div>
          <h1 className="forbidden-title">Access Denied</h1>
          <p className="forbidden-message">
            You do not have the required permissions to access this page.
          </p>
          <p className="forbidden-subtext">
            Required role: <strong>[{allowedRoles.join(', ')}]</strong>. Your role: <strong>{user?.role}</strong>.
          </p>
          <a href="/" className="btn btn-primary">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
