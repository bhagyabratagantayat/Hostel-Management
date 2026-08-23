import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Define navigation schemas per user role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
          { label: 'Hostels', icon: '🏢', path: '/admin/hostels' },
          { label: 'Students', icon: '🎓', path: '/admin/students' },
          { label: 'Attendance', icon: '📝', path: '/admin/attendance' },
        ];
      case 'SUPERINTENDENT':
        return [
          { label: 'Dashboard', icon: '📊', path: '/superintendent/dashboard' },
          { label: 'My Hostels', icon: '🏢', path: '/superintendent/hostels' },
          { label: 'Students', icon: '🎓', path: '/superintendent/students' },
          { label: 'Attendance', icon: '📝', path: '/superintendent/attendance' },
        ];
      case 'STUDENT':
        return [
          { label: 'Dashboard', icon: '📊', path: '/' },
          { label: 'My Profile', icon: '👤', path: '/student/profile' },
          { label: 'My Attendance', icon: '📝', path: '/student/attendance' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isItemActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🏨 CHMS</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu-list">
            {navItems.map((item, idx) => {
              const active = isItemActive(item);
              return (
                <li key={idx} className="sidebar-menu-item" onClick={onClose}>
                  <Link to={item.path} className={`sidebar-menu-link ${active ? 'active' : ''}`}>
                    <span className="sidebar-menu-icon">{item.icon}</span>
                    <span className="sidebar-menu-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            
            {/* Direct Logout action in list */}
            <li className="sidebar-menu-item sidebar-logout-item">
              <button onClick={logout} className="sidebar-menu-link sidebar-logout-btn">
                <span className="sidebar-menu-icon">🚪</span>
                <span className="sidebar-menu-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-user-badge">
            <div className="avatar-mini">{user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}</div>
            <div className="badge-meta">
              <span className="badge-name">{user?.username || 'User'}</span>
              <span className="badge-role">{user?.role || 'Guest'}</span>
            </div>
          </div>
          <span className="version-tag">Foundation v1.0.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
