import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests } from '../api/operations';
import MaintenanceFilterBar from '../components/operations/MaintenanceFilterBar';
import MaintenanceFormModal from '../components/operations/MaintenanceFormModal';
import MaintenanceDetailsModal from '../components/operations/MaintenanceDetailsModal';

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
        page: data.page,
        totalPages: data.totalPages,
        total: data.total
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
    switch (p) {
      case 'URGENT': return <span className="badge bg-danger text-white">URGENT</span>;
      case 'HIGH': return <span className="badge bg-warning text-dark">HIGH</span>;
      case 'MEDIUM': return <span className="badge bg-info text-dark">MEDIUM</span>;
      default: return <span className="badge bg-secondary">LOW</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'OPEN': return <span className="badge bg-secondary">OPEN</span>;
      case 'ASSIGNED': return <span className="badge bg-info text-dark">ASSIGNED</span>;
      case 'IN_PROGRESS': return <span className="badge bg-primary">IN_PROGRESS</span>;
      case 'RESOLVED': return <span className="badge bg-success">RESOLVED</span>;
      case 'CLOSED': return <span className="badge bg-dark">CLOSED</span>;
      case 'REOPENED': return <span className="badge bg-danger">REOPENED</span>;
      default: return <span className="badge bg-secondary">{s}</span>;
    }
  };

  const openDetail = (req) => {
    setSelectedRequest(req);
    setIsDetailOpen(true);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h4 font-weight-bold mb-1">
            <i className="bi bi-tools text-primary me-2"></i>
            Hostel Maintenance Management
          </h2>
          <p className="text-muted small mb-0">
            Report, track, and manage physical infrastructure and room maintenance requests.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsFormOpen(true)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Report Maintenance Issue
        </button>
      </div>

      {/* Filter Bar */}
      <MaintenanceFilterBar
        filters={filters}
        onFilterChange={setFilters}
        isStaff={isStaff}
      />

      {error && (
        <div className="alert alert-danger p-3 mb-4">
          <i className="bi bi-exclamation-octagon me-2"></i>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading maintenance requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <i className="bi bi-tools text-muted display-4 mb-3"></i>
          <h5>No Maintenance Requests Found</h5>
          <p className="text-muted small">No requests match your selected search or filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="d-none d-md-block card shadow-sm border mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Title & Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Reported By</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td className="fw-bold">#{req.id}</td>
                      <td>
                        <div className="fw-bold">{req.title}</div>
                        <span className="badge bg-light text-dark border small">{req.category}</span>
                      </td>
                      <td>{getPriorityBadge(req.priority)}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>
                        <div>{req.hostel_name || 'N/A'}</div>
                        <small className="text-muted">
                          {req.room_number ? `Room ${req.room_number}` : ''} {req.bed_number ? `(Bed ${req.bed_number})` : ''}
                        </small>
                      </td>
                      <td>
                        <div>{req.student_name || req.reporter_name || 'N/A'}</div>
                      </td>
                      <td>
                        {req.assignee_name ? (
                          <span className="text-dark font-weight-bold">{req.assignee_name}</span>
                        ) : (
                          <span className="text-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(req.reported_at || req.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openDetail(req)}
                        >
                          View & Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="d-block d-md-none vstack gap-3 mb-4">
            {requests.map(req => (
              <div key={req.id} className="card shadow-sm border p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="badge bg-dark me-2">#{req.id}</span>
                    <span className="fw-bold">{req.title}</span>
                  </div>
                  {getPriorityBadge(req.priority)}
                </div>

                <p className="text-muted small mb-2">{req.description}</p>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  {getStatusBadge(req.status)}
                  <span className="badge bg-light text-dark border">{req.category}</span>
                </div>

                <div className="small text-secondary mb-3">
                  <div><strong>Hostel:</strong> {req.hostel_name || 'N/A'}</div>
                  <div><strong>Room:</strong> {req.room_number ? `Room ${req.room_number}` : 'N/A'}</div>
                  <div><strong>Reported:</strong> {new Date(req.reported_at || req.created_at).toLocaleDateString()}</div>
                </div>

                <button
                  className="btn btn-outline-primary btn-sm w-100"
                  onClick={() => openDetail(req)}
                >
                  View Request Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total requests)
              </span>
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                >
                  Next
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
