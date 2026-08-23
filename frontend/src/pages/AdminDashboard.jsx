import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import HostelCard from '../components/HostelCard';
import AttendanceChart from '../components/AttendanceChart';
import OccupancySummary from '../components/OccupancySummary';
import './AdminDashboard.css';

// Stat card definitions for the overall section
const buildStats = (overall) => [
  { title: 'Total Hostels',   value: overall.totalHostels,        icon: '🏢', color: 'blue'  },
  { title: 'Total Students',  value: overall.totalStudents,        icon: '🎓', color: 'blue'  },
  { title: 'Total Rooms',     value: overall.totalRooms,           icon: '🚪'                 },
  { title: 'Total Beds',      value: overall.totalBeds,            icon: '🛏️'                },
  { title: 'Occupied Beds',   value: overall.occupiedBeds,         icon: '✅', color: 'green' },
  { title: 'Available Beds',  value: overall.availableBeds,        icon: '🟢', color: 'green' },
  { title: 'Maintenance',     value: overall.maintenanceBeds,      icon: '🔧', color: 'amber' },
  { title: 'Present Today',   value: overall.present,              icon: '👍', color: 'green' },
  { title: 'Absent Today',    value: overall.absent,               icon: '👎', color: 'red'   },
  { title: 'Not Marked',      value: overall.notMarked,            icon: '⏳', color: 'amber' },
  { title: 'Attendance %',    value: `${overall.attendancePercentage}%`, icon: '📈', color: 'blue' },
  { title: 'Occupancy %',     value: `${overall.occupancyPercentage}%`,  icon: '📊', color: 'blue' },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getDashboardOverview();
      setData(resp.data);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered hostel list
  const visibleHostels = data?.hostels?.filter(h =>
    filter === 'all' || String(h.hostelId) === filter
  ) ?? [];

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderSkeletonStats = () => (
    <div className="overall-stats-grid" aria-busy="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <StatCard key={i} title="" value="" loading />
      ))}
    </div>
  );

  const renderStats = () => (
    <div className="overall-stats-grid">
      {buildStats(data.overall).map((s) => (
        <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
      ))}
    </div>
  );

  return (
    <div className="admin-dashboard page-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">College-wide hostel overview</p>
        </div>
        <button
          className="refresh-btn"
          onClick={fetchData}
          disabled={loading}
          aria-label="Refresh dashboard data"
        >
          {loading ? '⏳' : '↻'} Refresh
        </button>
      </header>

      {/* Quick Actions */}
      <nav className="quick-actions" aria-label="Quick actions">
        <button onClick={() => navigate('/admin/hostels')}  className="qa-btn">🏢 Manage Hostels</button>
        <button onClick={() => navigate('/admin/students')} className="qa-btn">🎓 Add Student</button>
        <button onClick={() => navigate('/admin/attendance')} className="qa-btn">📝 Attendance</button>
      </nav>

      {/* Error state */}
      {error && (
        <div className="dashboard-error" role="alert">
          <p>⚠️ {error}</p>
          <button onClick={fetchData} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Overall stats */}
      {loading ? renderSkeletonStats() : (!error && data && renderStats())}

      {/* Charts */}
      {!loading && !error && data && (
        <>
          <div className="dashboard-charts">
            <AttendanceChart
              present={data.overall.present}
              absent={data.overall.absent}
              notMarked={data.overall.notMarked}
            />
            <OccupancySummary
              occupied={data.overall.occupiedBeds}
              available={data.overall.availableBeds}
              maintenance={data.overall.maintenanceBeds}
              occupancyPercentage={data.overall.occupancyPercentage}
            />
          </div>

          {/* Hostel cards with filter */}
          <div className="hostels-section">
            <div className="hostels-section__header">
              <h2 className="section-title">Hostel Overview</h2>
              <select
                className="hostel-filter"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                aria-label="Filter by hostel"
              >
                <option value="all">All Hostels</option>
                {data.hostels.map(h => (
                  <option key={h.hostelId} value={String(h.hostelId)}>{h.name}</option>
                ))}
              </select>
            </div>

            {visibleHostels.length === 0 ? (
              <p className="empty-state">No hostels available.</p>
            ) : (
              <div className="hostel-cards-grid">
                {visibleHostels.map(h => (
                  <HostelCard key={h.hostelId} hostel={h} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
