import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('_', ' ');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="navbar-logo-text">BEC Portal</span>
      </div>
      
      <div className="navbar-right">
        {user && (
          <div className="user-badge">
            <div className="user-avatar">{getInitials(user.username)}</div>
            <div className="user-info-desktop">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{formatRole(user.role)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
