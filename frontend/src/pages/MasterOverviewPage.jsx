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

  const metricItems = [
    { label: 'Total Hostels', value: summary?.totalHostels ?? summary?.hostels ?? 0, icon: '🏢', bg: '#e0e7ff', color: '#4338ca' },
    { label: 'Total Floors', value: summary?.totalFloors ?? summary?.floors ?? 0, icon: '📑', bg: '#dbeafe', color: '#1e40af' },
    { label: 'Total Rooms', value: summary?.totalRooms ?? summary?.rooms ?? 0, icon: '🚪', bg: '#cff4fc', color: '#055160' },
    { label: 'Total Beds', value: summary?.totalBeds ?? summary?.beds ?? 0, icon: '🛏️', bg: '#f3e8ff', color: '#6b21a8' },
    { label: 'Available Beds', value: summary?.availableBeds ?? 0, icon: '✅', bg: '#d1fae5', color: '#065f46' },
    { label: 'Occupied Beds', value: summary?.occupiedBeds ?? 0, icon: '👤', bg: '#fef3c7', color: '#92400e' },
    { label: 'Maintenance Beds', value: summary?.maintenanceBeds ?? 0, icon: '🔧', bg: '#ffe4e6', color: '#9f1239' },
    { label: 'Unallocated Students', value: summary?.unallocatedStudents ?? 0, icon: '🎓', bg: '#ffedd5', color: '#9a3412' }
  ];

  const steps = [
    { title: 'Hostels', step: 'Step 1', icon: '🏢', path: '/admin/master/hostels', desc: 'Manage hostels, codes, capacity, and active status.' },
    { title: 'Floors', step: 'Step 2', icon: '📑', path: '/admin/master/floors', desc: 'Manage hostel floors, level numbers, and floor naming.' },
    { title: 'Rooms', step: 'Step 3', icon: '🚪', path: '/admin/master/rooms', desc: 'Manage room numbers, capacity limits, and room status.' },
    { title: 'Beds', step: 'Step 4', icon: '🛏️', path: '/admin/master/beds', desc: 'Manage bed identifiers, occupancy status, and assignments.' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#1e1b4b', margin: 0 }}>
          🏛️ Master Data Hub
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Centralized administration and infrastructure hierarchy management.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-outline ml-2" onClick={fetchSummary}>Retry</button>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {metricItems.map((item, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: item.bg,
              color: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Hierarchy Cards */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
        Infrastructure Hierarchy Management
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {steps.map((s, idx) => (
          <Link key={idx} to={s.path} style={{
            textDecoration: 'none',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'none';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
              <span className="badge badge-indigo">{s.step}</span>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '4px 0' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                {s.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Safety Notice */}
      <div style={{
        background: '#eef2ff',
        border: '1px solid #c7d2fe',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '22px' }}>🛡️</span>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#3730a3', margin: 0 }}>
            Safety & Infrastructure Hierarchy Active
          </h4>
          <p style={{ fontSize: '13px', color: '#4338ca', margin: '2px 0 0 0' }}>
            Hostels, floors, rooms, and occupied beds are protected from accidental deletion when active student allocations exist.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasterOverviewPage;
