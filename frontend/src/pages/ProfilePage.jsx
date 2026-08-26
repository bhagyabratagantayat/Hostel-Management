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
  const [fullNameVal, setFullNameVal] = useState('');
  const [genderVal, setGenderVal] = useState('');
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
      setFullNameVal(userData?.full_name || userData?.student_profile?.full_name || '');
      setGenderVal(userData?.gender || '');
      setEmailVal(userData?.email || '');
      setPhoneVal(userData?.phone || userData?.student_profile?.phone_number || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load profile details.');
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
        full_name: fullNameVal,
        gender: genderVal || null,
        email: emailVal,
        phone_number: phoneVal,
        phone: phoneVal
      });
      setSuccess('Profile information updated successfully.');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
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
      setError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return <div className="profile-container text-center py-5">Loading user profile...</div>;
  }

  const st = profile?.student_profile;
  const displayName = profile?.full_name || st?.full_name || profile?.username;
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar">
          {st?.photo_url ? (
            <img src={st.photo_url} alt="Profile Avatar" />
          ) : (
            <div className="avatar-placeholder">{initials}</div>
          )}
        </div>
        <div className="profile-title-area">
          <h2>{displayName}</h2>
          <div className="profile-badges">
            <span className={`role-badge role-${profile?.role?.toLowerCase()}`}>{profile?.role}</span>
            <span className={`status-badge status-${profile?.status?.toLowerCase()}`}>{profile?.status}</span>
            {profile?.gender && (
              <span className={`gender-badge gender-${profile.gender.toLowerCase()}`}>
                {profile.gender === 'MALE' ? '👨 Male' : profile.gender === 'FEMALE' ? '👩 Female' : '👤 Other'}
              </span>
            )}
          </div>
          <p className="profile-meta">
            Account ID: #{profile?.id} • Username: <strong>{profile?.username}</strong> • Created: {new Date(profile?.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger my-3">{error}</div>}
      {success && <div className="alert alert-success my-3">{success}</div>}

      <div className="profile-grid">
        {/* Account & Details Information */}
        <div className="card profile-info-card">
          <h3>Account & Identity Details</h3>
          
          <div className="info-row">
            <span className="info-label">Full Name</span>
            <span className="info-val">{profile?.full_name || st?.full_name || 'Not set'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Gender</span>
            <span className="info-val">
              {profile?.gender ? (profile.gender === 'MALE' ? 'Male (👨)' : profile.gender === 'FEMALE' ? 'Female (👩)' : 'Other (👤)') : 'Not Specified'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Email Address</span>
            <span className="info-val">{profile?.email}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Contact Phone</span>
            <span className="info-val">{profile?.phone || st?.phone_number || 'Not Provided'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Last Login</span>
            <span className="info-val">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First Session'}</span>
          </div>

          {/* Assigned Hostels for Superintendents / Wardens */}
          {profile?.role === 'SUPERINTENDENT' && (
            <div className="superintendent-hostels-section mt-4">
              <h3>Assigned Hostels Management</h3>
              {profile?.assigned_hostels && profile.assigned_hostels.length > 0 ? (
                <div className="assigned-hostels-grid">
                  {profile.assigned_hostels.map(h => (
                    <div key={h.id} className="assigned-hostel-pill">
                      <span className="hostel-pill-icon">🏢</span>
                      <div className="hostel-pill-info">
                        <span className="hostel-pill-name">{h.name}</span>
                        <span className="hostel-pill-meta">{h.code} • {h.hostel_type || 'Hostel'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm mt-1">No specific hostels assigned currently. (Contact Super Admin)</p>
              )}
            </div>
          )}

          {/* Student Profile Info */}
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
          <h3 className="mt-4">Edit Profile Information</h3>
          <form onSubmit={handleProfileUpdate} className="mt-2">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dr. Ramesh Kumar"
                value={fullNameVal}
                onChange={(e) => setFullNameVal(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                className="form-control"
                value={genderVal}
                onChange={(e) => setGenderVal(e.target.value)}
              >
                <option value="">-- Select Gender --</option>
                <option value="MALE">Male (👨)</option>
                <option value="FEMALE">Female (👩)</option>
                <option value="OTHER">Other (👤)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone / Contact Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className="form-control"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary mt-2" disabled={updatingProfile}>
              {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
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
