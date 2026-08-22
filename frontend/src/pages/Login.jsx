import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // If already authenticated, redirect to home immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim() || !password) {
      setErrorMsg('Please fill in both fields.');
      return;
    }

    const result = await login(loginIdentifier, password);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message || 'Invalid username/email or password.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <div className="login-header">
          <span className="login-logo-icon">🏢</span>
          <h1 className="login-title">College Hostel Portal</h1>
          <p className="login-subtitle">Sign in to manage room bookings, view profile and check notices</p>
        </div>

        {errorMsg && (
          <div className="login-error-alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email or Username"
            id="loginIdentifier"
            placeholder="e.g. admin@hostel.com or superadmin"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            required
          />

          <div className="password-input-wrapper">
            <Input
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="login-submit-btn"
          >
            Sign In
          </Button>
        </form>

        <div className="login-footer">
          <p>Development Test Accounts:</p>
          <ul className="dev-accounts-list">
            <li><strong>Super Admin:</strong> <code>superadmin</code> / <code>password123</code></li>
            <li><strong>Warden:</strong> <code>warden</code> / <code>password123</code></li>
            <li><strong>Student:</strong> <code>student</code> / <code>password123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
