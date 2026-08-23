import React, { useState } from 'react';
import api from '../services/api';
import './ForcePasswordChangeModal.css';

const ForcePasswordChangeModal = ({ user, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password requirements calculation
  const reqs = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword
  };

  const isFormValid = reqs.length && reqs.upper && reqs.lower && reqs.number && reqs.match && currentPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => {
        if (onPasswordChanged) onPasswordChanged();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="force-password-overlay">
      <div className="force-password-modal">
        <div className="force-password-header">
          <div className="force-password-icon">🔒</div>
          <h2>Password Change Required</h2>
          <p>You are using a temporary or initial password. For security compliance, please set a new password to proceed.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="force-password-form">
          <div className="form-group">
            <label htmlFor="current-pass">Current Password *</label>
            <input
              id="current-pass"
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-pass">New Password *</label>
            <input
              id="new-pass"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-pass">Confirm New Password *</label>
            <input
              id="confirm-pass"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="password-checklist">
            <div className="checklist-title">Password Security Requirements:</div>
            <ul>
              <li className={reqs.length ? 'met' : ''}>{reqs.length ? '✓' : '○'} At least 8 characters long</li>
              <li className={reqs.upper ? 'met' : ''}>{reqs.upper ? '✓' : '○'} At least one uppercase letter (A-Z)</li>
              <li className={reqs.lower ? 'met' : ''}>{reqs.lower ? '✓' : '○'} At least one lowercase letter (a-z)</li>
              <li className={reqs.number ? 'met' : ''}>{reqs.number ? '✓' : '○'} At least one number (0-9)</li>
              <li className={reqs.match ? 'met' : ''}>{reqs.match ? '✓' : '○'} Passwords match</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block submit-btn"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Updating Password...' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
