import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import becLogo from '../assets/BEC LOGO FINAL.png';

import { Eye, EyeOff, AlertTriangle, Info, KeyRound, Sparkles, UserCheck } from 'lucide-react';

const Login = () => {
  const { login, studentFirstLogin, isAuthenticated, isLoading } = useAuth();
  const [loginMode, setLoginMode] = useState('STANDARD'); // 'STANDARD' | 'FIRST_TIME'

  // Standard Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First Time Activation State
  const [regNo, setRegNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // If already authenticated, redirect to home immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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

  const handleFirstTimeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regNo.trim() || !dateOfBirth) {
      setErrorMsg('Please provide both Registration Number and Date of Birth.');
      return;
    }

    const result = await studentFirstLogin(regNo, dateOfBirth);
    if (result.success) {
      // Upon successful identity verification, AuthContext opens ForcePasswordChangeModal
      navigate('/');
    } else {
      setErrorMsg(result.message || 'Invalid registration number or date of birth.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo-container">
            <img src={becLogo} alt="BEC College Logo" className="login-college-logo" />
          </div>
          <h1 className="login-title">BEC Hostel Portal</h1>
          <p className="login-subtitle">Sign in to manage room bookings, view profile and check notices</p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(241, 245, 249, 0.8)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <button
            type="button"
            onClick={() => { setLoginMode('STANDARD'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: loginMode === 'STANDARD' ? '#ffffff' : 'transparent',
              color: loginMode === 'STANDARD' ? '#1e293b' : '#64748b',
              boxShadow: loginMode === 'STANDARD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={15} /> Standard Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('FIRST_TIME'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: loginMode === 'FIRST_TIME' ? '#ffffff' : 'transparent',
              color: loginMode === 'FIRST_TIME' ? '#2563eb' : '#64748b',
              boxShadow: loginMode === 'FIRST_TIME' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={15} /> First Time Login?
          </button>
        </div>

        {errorMsg && (
          <div className="login-error-alert">
            <span className="alert-icon"><AlertTriangle size={16} /></span>
            <span className="alert-text">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success-alert" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <UserCheck size={16} /> {successMsg}
          </div>
        )}

        {loginMode === 'STANDARD' ? (
          <form onSubmit={handleStandardSubmit} className="login-form">
            <Input
              label="Registration No, Username or Email"
              id="loginIdentifier"
              placeholder="e.g. 2501316050, admin@bec.ac.in, or superadmin"
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <small style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '-10px', marginBottom: '14px', fontSize: '11.5px', color: '#64748b' }}>
              <Info size={13} style={{ flexShrink: 0 }} />
              <span>Sign in with your Registration Number / Username and password.</span>
            </small>

            <Button
              type="submit"
              isLoading={isLoading}
              className="login-submit-btn"
            >
              Sign In
            </Button>
          </form>
        ) : (
          <form onSubmit={handleFirstTimeSubmit} className="login-form">
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontSize: '12px',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>First-Time Student Activation:</strong> Verify your identity with your Registration Number and Date of Birth. You will be prompted to create a password immediately.
              </div>
            </div>

            <Input
              label="Registration Number *"
              id="regNo"
              placeholder="e.g. 2501316050"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              required
            />

            <Input
              label="Date of Birth *"
              id="dateOfBirth"
              type="date"
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="login-submit-btn"
            >
              Verify & Set Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
