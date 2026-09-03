import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests } from '../api/operations';
import MaintenanceFilterBar from '../components/operations/MaintenanceFilterBar';
import MaintenanceFormModal from '../components/operations/MaintenanceFormModal';
import MaintenanceDetailsModal from '../components/operations/MaintenanceDetailsModal';
import './MaintenancePage.css';

export default function MaintenancePage({ role = 'SUPER_ADMIN' }) {
  const isStaff = role === 'SUPER_ADMIN' || role === 'SUPERINTENDENT';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    hostel_id: '',
    category: '',
    status: '',
    priority: '',
    date_from: '',
    date_to: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMaintenanceRequests(filters);
      setRequests(data.requests || []);
      setPagination({
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const getPriorityBadge = (p) => {
    const priorityKey = (p || 'LOW').toLowerCase();
    const icon = p === 'URGENT' ? 'fa-triangle-exclamation' : p === 'HIGH' ? 'fa-arrow-up' : p === 'MEDIUM' ? 'fa-minus' : 'fa-arrow-down';
    return (
      <span className={`priority-pill priority-${priorityKey}`}>
        <i className={`fa-solid ${icon} mr-1`}></i>
        {p || 'LOW'}
      </span>
    );
  };

  const getStatusBadge = (s) => {
    const statusKey = (s || 'OPEN').toLowerCase();
    const icon = s === 'RESOLVED' ? 'fa-circle-check' : s === 'IN_PROGRESS' ? 'fa-spinner fa-spin' : s === 'CLOSED' ? 'fa-lock' : 'fa-envelope-open';
    return (
      <span className={`status-pill status-${statusKey}`}>
        <i className={`fa-solid ${icon} mr-1`}></i>
        {(s || 'OPEN').replace('_', ' ')}
      </span>
    );
  };

  const openDetail = (req) => {
    setSelectedRequest(req);
    setIsDetailOpen(true);
  };

  return (
    <div className="maintenance-page">
      {/* Top Header */}
      <div className="maintenance-header-row">
        <div>
          <div className="page-intro-badge">
            <i className="fa-solid fa-wrench"></i> Operations & Maintenance
          </div>
          <h1 className="maintenance-title">
            <span>Hostel Maintenance Management</span>
          </h1>
          <p className="maintenance-sub">
            Track physical infrastructure issues, repairs, room equipment, and resolve maintenance requests campus-wide.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary-gradient"
          onClick={() => setIsFormOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <i className="fa-solid fa-plus"></i>
          <span>Report Maintenance Issue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <MaintenanceFilterBar
        filters={filters}
        onFilterChange={setFilters}
        isStaff={isStaff}
      />

      {error && (
        <div className="alert-error-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-triangle-exclamation text-rose-500"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div className="spinner mb-3" style={{ margin: '0 auto' }}></div>
          <p style={{ fontWeight: 600 }}>Loading maintenance requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ background: '#ffffff', border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
          <i className="fa-solid fa-screwdriver-wrench text-slate-300" style={{ fontSize: '3rem', marginBottom: '12px', display: 'block' }}></i>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>No Maintenance Requests Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No requests match your current search or filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Table Card */}
          <div className="maintenance-table-card" style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{ width: '100%', minWidth: '850px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Title & Category</th>
                  <th style={{ width: '120px' }}>Priority</th>
                  <th style={{ width: '140px' }}>Status</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Assigned Staff</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <span className="badge-id">#{req.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.title}</div>
                      <span className="badge-category" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-tag text-xs"></i>
                        {req.category}
                      </span>
                    </td>
                    <td>{getPriorityBadge(req.priority)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-building text-slate-400 text-xs"></i>
                        {req.hostel_name || 'Campus Wide'}
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {req.room_number ? `Room ${req.room_number}` : ''} {req.bed_number ? `(Bed ${req.bed_number})` : ''}
                      </small>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-user text-slate-400 text-xs"></i>
                        {req.student_name || req.reporter_name || 'Student / User'}
                      </div>
                    </td>
                    <td>
                      {req.assignee_name ? (
                        <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-user-shield text-indigo-500 text-xs"></i>
                          {req.assignee_name}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <small style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-regular fa-calendar text-xs"></i>
                        {new Date(req.reported_at || req.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-manage-action"
                        onClick={() => openDetail(req)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className="fa-solid fa-gear"></i> View & Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '0.86rem' }}>
                Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total requests)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="filter-reset-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                >
                  <i className="fa-solid fa-chevron-left mr-1"></i> Previous
                </button>
                <button
                  type="button"
                  className="filter-reset-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                >
                  Next <i className="fa-solid fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      <MaintenanceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadRequests}
        isStaff={isStaff}
      />

      {/* Details Modal */}
      {selectedRequest && (
        <MaintenanceDetailsModal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedRequest(null); }}
          request={selectedRequest}
          onRefresh={() => {
            loadRequests();
            setIsDetailOpen(false);
          }}
          isStaff={isStaff}
        />
      )}
    </div>
  );
}
