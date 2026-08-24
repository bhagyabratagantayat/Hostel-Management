import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Profile Form State
  const [emailVal, setEmailVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const passReqs = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword
  };

  const isPassFormValid = passReqs.length && passReqs.upper && passReqs.lower && passReqs.number && passReqs.match && currentPassword;

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMe();
      const userData = res.user || res.data?.user || res.data;
      setProfile(userData);
      setEmailVal(userData?.email || '');
      if (userData?.student_profile) {
        setPhoneVal(userData.student_profile.phone_number || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');
    setSuccess('');

    try {
      await api.updateSelfProfile({
        email: emailVal,
        phone_number: phoneVal
      });
      setSuccess('Profile information updated successfully.');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!isPassFormValid) return;

    setChangingPass(true);
    setError('');
    setSuccess('');

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return <div className="profile-container text-center py-5">Loading user profile...</div>;
  }

  const st = profile?.student_profile;

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar">
          {st?.photo_url ? (
            <img src={st.photo_url} alt="Profile Avatar" />
          ) : (
            <div className="avatar-placeholder">{profile?.username?.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="profile-title-area">
          <h2>{st?.full_name || profile?.username}</h2>
          <div className="profile-badges">
            <span className={`role-badge role-${profile?.role?.toLowerCase()}`}>{profile?.role}</span>
            <span className={`status-badge status-${profile?.status?.toLowerCase()}`}>{profile?.status}</span>
          </div>
          <p className="profile-meta">Account ID: #{profile?.id} • Created: {new Date(profile?.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {error && <div className="alert alert-danger my-3">{error}</div>}
      {success && <div className="alert alert-success my-3">{success}</div>}

      <div className="profile-grid">
        {/* Account & Accommodation Information */}
        <div className="card profile-info-card">
          <h3>Account & Identity Details</h3>
          
          <div className="info-row">
            <span className="info-label">Username</span>
            <span className="info-val">{profile?.username}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Email Address</span>
            <span className="info-val">{profile?.email}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Last Login</span>
            <span className="info-val">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First Session'}</span>
          </div>

          {profile?.role === 'STUDENT' && st && (
            <>
              <h3 className="mt-4">Accommodation & Academic Profile</h3>
              <div className="info-row">
                <span className="info-label">Student ID</span>
                <span className="info-val">{st.student_code}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Roll Number</span>
                <span className="info-val">{st.roll_number || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Branch & Course</span>
                <span className="info-val">{st.branch} • {st.course} (Year {st.year_of_study})</span>
              </div>
              <div className="info-row">
                <span className="info-label">Hostel & Room</span>
                <span className="info-val highlight">{st.hostel_name || 'Not Allocated'} {st.room_number ? `(Room ${st.room_number}, Bed ${st.bed_number})` : ''}</span>
              </div>
            </>
          )}

          {/* Edit Profile Form */}
          <h3 className="mt-4">Update Contact Information</h3>
          <form onSubmit={handleProfileUpdate} className="mt-2">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                required
              />
            </div>

            {profile?.role === 'STUDENT' && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn btn-secondary mt-2" disabled={updatingProfile}>
              {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="card profile-pass-card">
          <h3>Change Security Password</h3>
          <p className="text-muted text-sm mb-3">Update your login password regularly to protect your account.</p>

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="password-checklist mt-3 mb-3">
              <div className="checklist-title">Complexity Requirements:</div>
              <ul>
                <li className={passReqs.length ? 'met' : ''}>{passReqs.length ? '✓' : '○'} 8+ characters</li>
                <li className={passReqs.upper ? 'met' : ''}>{passReqs.upper ? '✓' : '○'} 1 uppercase letter</li>
                <li className={passReqs.lower ? 'met' : ''}>{passReqs.lower ? '✓' : '○'} 1 lowercase letter</li>
                <li className={passReqs.number ? 'met' : ''}>{passReqs.number ? '✓' : '○'} 1 number</li>
                <li className={passReqs.match ? 'met' : ''}>{passReqs.match ? '✓' : '○'} Passwords match</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={!isPassFormValid || changingPass}>
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
