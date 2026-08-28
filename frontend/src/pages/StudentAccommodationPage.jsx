import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './StudentAccommodationPage.css';

const StudentAccommodationPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccommodation();
  }, []);

  const fetchAccommodation = () => {
    setLoading(true);
    setError('');
    api.getMyAllocation()
      .then(res => {
        setData(res.data?.data || res.data || null);
      })
      .catch(err => {
        console.error('Error fetching accommodation profile:', err);
        setError(err.response?.data?.message || 'Unable to load accommodation details.');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="accommodation-container">
        <div className="loading-box">
          <div className="spinner-sm" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b' }}>Loading your accommodation details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="accommodation-container">
        <div className="error-box">
          <h3>⚠️ Unable to Load Details</h3>
          <p>{error || 'No accommodation profile found.'}</p>
          <button className="btn btn-primary btn-sm mt-3" onClick={fetchAccommodation}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { currentAllocation, roommates = [], history = [] } = data;

  return (
    <div className="accommodation-container">
      {/* Page Header */}
      <div className="page-intro">
        <h1 className="page-title">🛏️ My Hostel Accommodation</h1>
        <p className="page-subtitle">Your active room assignment, roommates, and complete stay history.</p>
      </div>

      {/* Hero Active Allocation Card */}
      <div className="accommodation-hero-card">
        <div className="hero-glow-blob"></div>

        <div className="hero-top-row">
          <div>
            <span className={`alloc-badge ${currentAllocation ? 'active' : 'unallocated'}`}>
              {currentAllocation ? '● Active Room Allocation' : '○ Not Allocated'}
            </span>
            <h2 className="hostel-name-heading">
              {currentAllocation ? currentAllocation.hostel_name : 'No Active Room Assignment'}
            </h2>
            <p className="hostel-sub-info">
              {currentAllocation
                ? `${currentAllocation.hostel_code ? `[${currentAllocation.hostel_code}] ` : ''}Campus Hostel Residence`
                : 'Please contact the hostel warden or administration for room allocation.'}
            </p>
          </div>
        </div>

        {currentAllocation && (
          <div className="alloc-metrics-grid">
            <div className="metric-pill-box">
              <span className="metric-icon">🚪</span>
              <div>
                <span className="metric-label">Room No</span>
                <div className="metric-value">Room {currentAllocation.room_number}</div>
              </div>
            </div>

            <div className="metric-pill-box">
              <span className="metric-icon">🛏️</span>
              <div>
                <span className="metric-label">Bed Assignment</span>
                <div className="metric-value">Bed {currentAllocation.bed_number}</div>
              </div>
            </div>

            <div className="metric-pill-box">
              <span className="metric-icon">🏢</span>
              <div>
                <span className="metric-label">Floor</span>
                <div className="metric-value">{currentAllocation.floor_name || 'Ground Floor'}</div>
              </div>
            </div>

            <div className="metric-pill-box">
              <span className="metric-icon">📅</span>
              <div>
                <span className="metric-label">Stay Since</span>
                <div className="metric-value">
                  {currentAllocation.allocated_from
                    ? new Date(currentAllocation.allocated_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Current Term'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Roommates Card (if any) */}
      {currentAllocation && (
        <div className="roommates-card">
          <div className="card-title-bar">
            <h3>
              👥 Room Companions / Roommates
            </h3>
            <span className="roommate-count-pill">
              {roommates.length === 0 ? 'No roommates currently' : `${roommates.length} Roommate${roommates.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {roommates.length === 0 ? (
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
              You currently have no active roommates assigned in Room {currentAllocation.room_number}.
            </p>
          ) : (
            <div className="roommates-grid">
              {roommates.map((rm) => {
                const initials = rm.full_name ? rm.full_name.substring(0, 2).toUpperCase() : 'RM';
                return (
                  <div key={rm.id} className="roommate-card-item">
                    <div className="roommate-avatar">
                      {rm.photo_url ? (
                        <img src={rm.photo_url} alt={rm.full_name} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="roommate-info">
                      <strong className="roommate-name">{rm.full_name}</strong>
                      <span className="roommate-meta">{rm.branch} • Year {rm.year}</span>
                      <span className="roommate-bed-tag">🛏️ Bed {rm.bed_number}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stay History Timeline */}
      <div className="history-card">
        <div className="card-title-bar">
          <h3>📜 Accommodation History</h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {history.length} Record{history.length !== 1 ? 's' : ''}
          </span>
        </div>

        {history.length === 0 ? (
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
            No past accommodation history records found.
          </p>
        ) : (
          <div className="history-timeline">
            {history.map((item) => {
              const fromDate = item.allocated_from
                ? new Date(item.allocated_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'N/A';
              const untilDate = item.allocated_until
                ? new Date(item.allocated_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Present';

              return (
                <div key={item.id} className={`timeline-entry status-${item.status.toLowerCase()}`}>
                  <div className="timeline-header">
                    <div className="timeline-room-title">
                      {item.hostel_name} &bull; Room {item.room_number} &bull; Bed {item.bed_number}
                    </div>
                    <span className={`timeline-status-pill ${item.status}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="timeline-dates">
                    <strong>Stay Period:</strong> {fromDate} &mdash; {untilDate}
                  </div>

                  {item.transfer_reason && (
                    <div className="timeline-reason" style={{ color: '#1e40af' }}>
                      <strong>Transfer Reason:</strong> {item.transfer_reason}
                    </div>
                  )}

                  {item.checkout_reason && (
                    <div className="timeline-reason" style={{ color: '#b91c1c' }}>
                      <strong>Checkout Reason:</strong> {item.checkout_reason} {item.custom_reason ? `(${item.custom_reason})` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warden Help Box */}
      <div className="warden-help-card">
        <div className="help-icon">ℹ️</div>
        <div className="help-content">
          <h4>Room Change or Maintenance Inquiry?</h4>
          <p>
            Need a room transfer or having issues with your allocated bed? You can file a complaint under <strong>My Complaints</strong> or contact your Hostel Superintendent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentAccommodationPage;
