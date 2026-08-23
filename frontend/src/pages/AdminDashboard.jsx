import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import HostelCard from '../components/HostelCard';
import AttendanceChart from '../components/AttendanceChart';
import OccupancySummary from '../components/OccupancySummary';
import Loading from '../components/Loading';
import './AdminDashboard.css';

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getDashboardOverview();
      setData(resp.data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderOverall = () => {
    const { overall } = data;
    const stats = [
      { title: 'Total Hostels', value: overall.totalHostels },
      { title: 'Total Students', value: overall.totalStudents },
      { title: 'Total Rooms', value: overall.totalRooms },
      { title: 'Total Beds', value: overall.totalBeds },
      { title: 'Occupied Beds', value: overall.occupiedBeds },
      { title: 'Available Beds', value: overall.availableBeds },
      { title: 'Present Today', value: overall.present },
      { title: 'Absent Today', value: overall.absent },
      { title: 'Not Marked Today', value: overall.notMarked },
      { title: 'Attendance %', value: `${overall.attendancePercentage}%` },
      { title: 'Occupancy %', value: `${overall.occupancyPercentage}%` }
    ];
    return (
      <div className="overall-stats-grid">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} />
        ))}
      </div>
    );
  };

  const renderHostels = () => {
    const { hostels } = data;
    return (
      <div className="hostel-cards-grid">
        {hostels.map((h) => (
          <HostelCard key={h.hostelId} hostel={h} />
        ))}
      </div>
    );
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="error-state">
      <p>{error}</p>
      <button onClick={fetchData}>Retry</button>
    </div>
  );
  if (!data) return null;

  return (
    <div className="admin-dashboard page-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="refresh-btn" onClick={fetchData}>↻ Refresh</button>
      </header>
      {renderOverall()}
      <AttendanceChart present={data.overall.present} absent={data.overall.absent} notMarked={data.overall.notMarked} />
      <OccupancySummary occupied={data.overall.occupiedBeds} available={data.overall.availableBeds} maintenance={data.overall.maintenanceBeds} />
      <h2 className="section-title">Hostel Overview</h2>
      {renderHostels()}
    </div>
  );
}

export default AdminDashboard;
