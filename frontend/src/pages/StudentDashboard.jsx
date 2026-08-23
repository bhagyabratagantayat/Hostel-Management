import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RecentNoticesSection from '../components/RecentNoticesSection';
import NoticeDetailsModal from '../components/NoticeDetailsModal';
import Loading from '../components/Loading';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentProfile, setStudentProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch dashboard overview (which contains overall, hostels, recentNotices)
      const dashRes = await api.getDashboardOverview();
      if (dashRes.success && Array.isArray(dashRes.recentNotices)) {
        setRecentNotices(dashRes.recentNotices);
      }

      // 2. Fetch unread notices count
      const unreadRes = await api.getUnreadCount();
      if (unreadRes.success) {
        setUnreadCount(unreadRes.unreadCount || 0);
      }

      // 3. Fetch student profile details
      try {
        const profileRes = await api.get('/students/me');
        if (profileRes.success && profileRes.student) {
          setStudentProfile(profileRes.student);
        }
      } catch (pErr) {
        console.warn('Student profile endpoint fallback:', pErr);
      }

    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Unable to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReadMarked = (noticeId) => {
    setRecentNotices(prev => prev.map(n => n.id === noticeId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  if (loading) {
    return <Loading message="Preparing your student dashboard..." />;
  }

  return (
    <div className="student-dashboard">
      {/* Welcome Banner */}
      <div className="student-welcome-card">
        <div className="welcome-info">
          <span className="welcome-tag">Student Dashboard</span>
          <h1 className="welcome-name">Welcome back, {studentProfile?.full_name || user?.username || 'Student'}!</h1>
          <p className="welcome-details">
            {studentProfile ? `${studentProfile.branch} • Year ${studentProfile.year} • Roll No: ${studentProfile.roll_number}` : 'College Hostel Management System'}
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="unread-alert-badge-card" onClick={() => navigate('/student/notices')}>
            <span className="alert-bell">🔔</span>
            <div className="alert-text">
              <span className="alert-count">{unreadCount} Unread Notice{unreadCount > 1 ? 's' : ''}</span>
              <span className="alert-action">Tap to view →</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="dashboard-error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="student-actions-grid">
        <div className="action-tile tile-notices" onClick={() => navigate('/student/notices')}>
          <div className="tile-icon">📢</div>
          <div className="tile-content">
            <h3>Notice Board</h3>
            <p>Read hostel notices & official announcements</p>
          </div>
          {unreadCount > 0 && <span className="tile-badge">{unreadCount}</span>}
        </div>

        <div className="action-tile tile-attendance" onClick={() => navigate('/attendance')}>
          <div className="tile-icon">📅</div>
          <div className="tile-content">
            <h3>My Attendance</h3>
            <p>View daily attendance logs & monthly summary</p>
          </div>
        </div>

        <div className="action-tile tile-profile" onClick={() => navigate('/profile')}>
          <div className="tile-icon">👤</div>
          <div className="tile-content">
            <h3>My Profile</h3>
            <p>View room allocation & student ID details</p>
          </div>
        </div>
      </div>

      {/* Recent Notices Section */}
      <RecentNoticesSection
        notices={recentNotices}
        userRole="STUDENT"
        onViewNotice={(notice) => setSelectedNotice(notice)}
        loading={false}
      />

      {/* Detail Modal */}
      {selectedNotice && (
        <NoticeDetailsModal
          notice={selectedNotice}
          userRole="STUDENT"
          onClose={() => setSelectedNotice(null)}
          onReadMarked={handleReadMarked}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
