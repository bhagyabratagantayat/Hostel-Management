import React from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { label: 'Dashboard', icon: '📊', active: true },
    { label: 'Hostels', icon: '🏢' },
    { label: 'Rooms', icon: '🚪' },
    { label: 'Beds', icon: '🛏️' },
    { label: 'Students', icon: '🎓' },
    { label: 'Attendance', icon: '📝' },
    { label: 'Notices', icon: '📢' },
  ];

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
            {menuItems.map((item, idx) => (
              <li key={idx} className="sidebar-menu-item">
                <a href="#" className={`sidebar-menu-link ${item.active ? 'active' : ''}`}>
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <span className="version-tag">Foundation v1.0.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
