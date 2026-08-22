import React from 'react';

const Navbar = ({ onToggleSidebar }) => {
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
        <span className="navbar-logo-text">Meridian Portal</span>
      </div>
      
      <div className="navbar-right">
        <div className="user-badge">
          <div className="user-avatar">SA</div>
          <div className="user-info-desktop">
            <span className="user-name">System Administrator</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
