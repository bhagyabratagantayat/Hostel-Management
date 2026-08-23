import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import Login from './pages/Login';
import HostelsPage from './pages/HostelsPage';
import HostelDetailsPage from './pages/HostelDetailsPage';
import StudentsPage from './pages/StudentsPage';
import AdminDashboard from './pages/AdminDashboard';
import SuperintendentDashboard from './pages/SuperintendentDashboard';
import Loading from './components/Loading';

/**
 * RoleRedirect — sends authenticated users to their role-specific dashboard.
 * Unauthenticated users go to /login (handled by ProtectedRoute).
 */
const RoleRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="fullscreen-loading"><Loading message="Loading..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'SUPER_ADMIN':     return <Navigate to="/admin/dashboard" replace />;
    case 'SUPERINTENDENT':  return <Navigate to="/superintendent/dashboard" replace />;
    default:                return <DashboardLayout><DashboardPlaceholder /></DashboardLayout>;
  }
};

// Inline placeholder for not-yet-implemented routes
const RoutePlaceholder = ({ title }) => (
  <div className="placeholder-page">
    <h1 className="page-heading">{title}</h1>
    <p className="page-subheading">This feature will be available in a future phase.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Root — redirect by role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          {/* ── SUPER ADMIN ────────────────────────────────────────────── */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard"           element={<AdminDashboard />} />
                    <Route path="hostels"             element={<HostelsPage />} />
                    <Route path="hostels/:hostelId"   element={<HostelDetailsPage />} />
                    <Route path="students"            element={<StudentsPage />} />
                    <Route path="attendance"          element={<RoutePlaceholder title="Attendance Management" />} />
                    <Route path="*"                   element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── SUPERINTENDENT ─────────────────────────────────────────── */}
          <Route
            path="/superintendent/*"
            element={
              <ProtectedRoute allowedRoles={['SUPERINTENDENT']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard"           element={<SuperintendentDashboard />} />
                    <Route path="hostels"             element={<HostelsPage />} />
                    <Route path="hostels/:hostelId"   element={<HostelDetailsPage />} />
                    <Route path="students"            element={<StudentsPage />} />
                    <Route path="attendance"          element={<RoutePlaceholder title="Attendance Management" />} />
                    <Route path="*"                   element={<Navigate to="/superintendent/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── STUDENT ────────────────────────────────────────────────── */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="profile"    element={<Navigate to="/" replace />} />
                    <Route path="attendance" element={<RoutePlaceholder title="My Attendance" />} />
                    <Route path="*"          element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
