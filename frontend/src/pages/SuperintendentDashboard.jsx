import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import HostelCard from '../components/HostelCard';
import AttendanceChart from '../components/AttendanceChart';
import OccupancySummary from '../components/OccupancySummary';
import Loading from '../components/Loading';
import RecentNoticesSection from '../components/RecentNoticesSection';
import NoticeDetailsModal from '../components/NoticeDetailsModal';
import './SuperintendentDashboard.css';

const buildStats = (overall) => [
  { title: 'My Hostels',    value: overall.totalHostels,           icon: '🏢', color: 'blue'  },
  { title: 'Students',      value: overall.totalStudents,          icon: '🎓', color: 'blue'  },
  { title: 'Rooms',         value: overall.totalRooms,             icon: '🚪'                 },
  { title: 'Total Beds',    value: overall.totalBeds,              icon: '🛏️'                },
  { title: 'Occupied Beds', value: overall.occupiedBeds,           icon: '✅', color: 'green' },
  { title: 'Available',     value: overall.availableBeds,          icon: '🟢', color: 'green' },
  { title: 'Maintenance',   value: overall.maintenanceBeds,        icon: '🔧', color: 'amber' },
  { title: 'Present Today', value: overall.present,                icon: '👍', color: 'green' },
  { title: 'Absent Today',  value: overall.absent,                 icon: '👎', color: 'red'   },
  { title: 'Not Marked',    value: overall.notMarked,              icon: '⏳', color: 'amber' },
  { title: 'Attendance %',  value: `${overall.attendancePercentage}%`, icon: '📈', color: 'blue' },
  { title: 'Occupancy %',   value: `${overall.occupancyPercentage}%`,  icon: '📊', color: 'blue' },
];

function SuperintendentDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getDashboardOverview();
      setData(resp.data || resp);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleHostels = data?.hostels?.filter(h =>
    filter === 'all' || String(h.hostelId) === filter
  ) ?? [];

  return (
    <div className="super-dashboard page-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Dashboard</h1>
          <p className="dashboard-subtitle">Your assigned hostels overview</p>
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
        <button onClick={() => navigate('/superintendent/students')}   className="qa-btn">🎓 Students</button>
        <button onClick={() => navigate('/superintendent/hostels')}    className="qa-btn">🏢 Rooms & Beds</button>
        <button onClick={() => navigate('/superintendent/attendance')} className="qa-btn">📝 Mark Attendance</button>
        <button onClick={() => navigate('/superintendent/notices')}    className="qa-btn">📢 Notice Board</button>
      </nav>

      {/* Error */}
      {error && (
        <div className="dashboard-error" role="alert">
          <p>⚠️ {error}</p>
          <button onClick={fetchData} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Overall stats — skeleton while loading */}
      {loading ? (
        <div className="overall-stats-grid" aria-busy="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <StatCard key={i} title="" value="" loading />
          ))}
        </div>
      ) : (!error && data && (
        <div className="overall-stats-grid">
          {buildStats(data.overall).map(s => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
          ))}
        </div>
      ))}

      {/* Recent Notices Section */}
      {!loading && !error && (
        <RecentNoticesSection
          notices={data?.recentNotices || []}
          userRole="SUPERINTENDENT"
          onViewNotice={(n) => setSelectedNotice(n)}
        />
      )}

      {/* Charts + hostel cards */}
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

          <div className="hostels-section">
            <div className="hostels-section__header">
              <h2 className="section-title">My Hostels</h2>
              {data.hostels.length > 1 && (
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
              )}
            </div>

            {visibleHostels.length === 0 ? (
              <p className="empty-state">No hostels assigned to your account.</p>
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

      {/* Detail Modal */}
      {selectedNotice && (
        <NoticeDetailsModal
          notice={selectedNotice}
          userRole="SUPERINTENDENT"
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
}

export default SuperintendentDashboard;
