import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  // Define navigation schemas per user role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Dashboard', icon: '📊', active: true },
          { label: 'Hostels', icon: '🏢' },
          { label: 'Students', icon: '🎓' },
          { label: 'Rooms & Beds', icon: '🚪' },
          { label: 'Superintendents', icon: '👤' },
          { label: 'Attendance', icon: '📝' },
          { label: 'Notices', icon: '📢' },
          { label: 'Reports', icon: '📈' },
          { label: 'Settings', icon: '⚙️' }
        ];
      case 'SUPERINTENDENT':
        return [
          { label: 'Dashboard', icon: '📊', active: true },
          { label: 'My Hostels', icon: '🏢' },
          { label: 'Students', icon: '🎓' },
          { label: 'Rooms & Beds', icon: '🚪' },
          { label: 'Attendance', icon: '📝' },
          { label: 'Notices', icon: '📢' }
        ];
      case 'STUDENT':
        return [
          { label: 'Dashboard', icon: '📊', active: true },
          { label: 'My Profile', icon: '👤' },
          { label: 'My Attendance', icon: '📝' },
          { label: 'Notices', icon: '📢' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

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
            {navItems.map((item, idx) => (
              <li key={idx} className="sidebar-menu-item">
                <a href="#" className={`sidebar-menu-link ${item.active ? 'active' : ''}`}>
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </a>
              </li>
            ))}
            
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
