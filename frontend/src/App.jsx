import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import Login from './pages/Login';

// Inline simple placeholder to demonstrate protected route scopes
const RoutePlaceholder = ({ title, roleRequired }) => (
  <div className="placeholder-page">
    <h1 className="page-heading">{title}</h1>
    <p className="page-subheading">
      This page is secure and currently requires the <strong>{roleRequired}</strong> role to access.
    </p>
    <div className="placeholder-mock-content">
      <p>Operations and actions for this screen are scheduled for implementation in a later phase.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Core Authenticated Dashboard Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPlaceholder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Secure Admin Scopes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="hostels" element={<RoutePlaceholder title="Admin: Manage Hostels" roleRequired="SUPER_ADMIN" />} />
                    <Route path="students" element={<RoutePlaceholder title="Admin: Manage Student Registrations" roleRequired="SUPER_ADMIN" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Secure Superintendent Scopes */}
          <Route
            path="/superintendent/*"
            element={
              <ProtectedRoute allowedRoles={['SUPERINTENDENT']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="students" element={<RoutePlaceholder title="Warden: Hostel Student List" roleRequired="SUPERINTENDENT" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Secure Student Scopes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="profile" element={<Navigate to="/" replace />} />
                    <Route path="attendance" element={<RoutePlaceholder title="Student: Attendance Log" roleRequired="STUDENT" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
