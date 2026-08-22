import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      
      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar onToggleSidebar={handleToggleSidebar} />
        
        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
