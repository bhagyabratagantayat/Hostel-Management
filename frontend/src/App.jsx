import React from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPlaceholder from './pages/DashboardPlaceholder';

function App() {
  return (
    <DashboardLayout>
      <DashboardPlaceholder />
    </DashboardLayout>
  );
}

export default App;
