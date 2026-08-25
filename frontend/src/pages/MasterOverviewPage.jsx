import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const MasterOverviewPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMasterSummary();
      if (res.success) {
        setSummary(res.data);
      } else {
        setError(res.message || 'Failed to load master data summary.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching master data summary.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading Master Data Metrics..." />;

  return (
    <div className="master-overview-container">
      <div className="page-header">
        <div>
          <h1 className="page-heading">🏛️ Master Data Management</h1>
          <p className="page-subheading">
            Centralized administration, infrastructure hierarchy, and data integrity control.
          </p>
        </div>
        <div className="header-actions">
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-outline ml-2" onClick={fetchSummary}>Retry</button>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="metrics-grid mb-6">
        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-indigo-100 text-indigo-600">🏢</div>
          <div className="metric-content">
            <span className="metric-label">Total Hostels</span>
            <span className="metric-value">{summary?.totalHostels ?? summary?.hostels ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-blue-100 text-blue-600">📑</div>
          <div className="metric-content">
            <span className="metric-label">Total Floors</span>
            <span className="metric-value">{summary?.totalFloors ?? summary?.floors ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-cyan-100 text-cyan-600">🚪</div>
          <div className="metric-content">
            <span className="metric-label">Total Rooms</span>
            <span className="metric-value">{summary?.totalRooms ?? summary?.rooms ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-purple-100 text-purple-600">🛏️</div>
          <div className="metric-content">
            <span className="metric-label">Total Beds</span>
            <span className="metric-value">{summary?.totalBeds ?? summary?.beds ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-emerald-100 text-emerald-600">✅</div>
          <div className="metric-content">
            <span className="metric-label">Available Beds</span>
            <span className="metric-value">{summary?.availableBeds ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-amber-100 text-amber-600">👤</div>
          <div className="metric-content">
            <span className="metric-label">Occupied Beds</span>
            <span className="metric-value">{summary?.occupiedBeds ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-rose-100 text-rose-600">🔧</div>
          <div className="metric-content">
            <span className="metric-label">Maintenance Beds</span>
            <span className="metric-value">{summary?.maintenanceBeds ?? 0}</span>
          </div>
        </div>

        <div className="metric-card shadow-sm">
          <div className="metric-icon bg-orange-100 text-orange-600">🎓</div>
          <div className="metric-content">
            <span className="metric-label">Unallocated Students</span>
            <span className="metric-value">{summary?.unallocatedStudents ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Hierarchy Quick Links */}
      <h2 className="section-title text-xl font-bold mb-4">Infrastructure Hierarchy Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/admin/master/hostels" className="nav-card p-5 bg-white rounded-lg border hover:border-indigo-500 shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🏢</span>
            <span className="badge badge-indigo">Step 1</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">Hostels</h3>
          <p className="text-sm text-gray-500 mt-1">Manage hostels, codes, capacity, and active status.</p>
        </Link>

        <Link to="/admin/master/floors" className="nav-card p-5 bg-white rounded-lg border hover:border-indigo-500 shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📑</span>
            <span className="badge badge-indigo">Step 2</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">Floors</h3>
          <p className="text-sm text-gray-500 mt-1">Manage hostel floors, level numbers, and floor naming.</p>
        </Link>

        <Link to="/admin/master/rooms" className="nav-card p-5 bg-white rounded-lg border hover:border-indigo-500 shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🚪</span>
            <span className="badge badge-indigo">Step 3</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">Rooms</h3>
          <p className="text-sm text-gray-500 mt-1">Manage room numbers, capacity limits, and room status.</p>
        </Link>

        <Link to="/admin/master/beds" className="nav-card p-5 bg-white rounded-lg border hover:border-indigo-500 shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🛏️</span>
            <span className="badge badge-indigo">Step 4</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">Beds</h3>
          <p className="text-sm text-gray-500 mt-1">Manage bed identifiers, occupancy status, and assignments.</p>
        </Link>
      </div>

      {/* Safety & Integrity Banner */}
      <div className="banner bg-indigo-50 border border-indigo-200 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-indigo-900 text-base">🛡️ Data Integrity & Safety Guardrails Active</h3>
          <p className="text-sm text-indigo-700 mt-1">
            Hostels, floors, rooms, and occupied beds are protected from accidental deactivation or deletion when active allocations exist.
          </p>
        </div>
    </div>
  );
};

export default MasterOverviewPage;
