import React, { useState } from 'react';
import {
  updateMaintenanceStatus,
  assignMaintenanceStaff,
  updateMaintenancePriority,
  addMaintenanceUpdate
} from '../../api/operations';

export default function MaintenanceDetailsModal({
  isOpen,
  onClose,
  request,
  onRefresh,
  isStaff = false,
  staffList = []
}) {
  const [newComment, setNewComment] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionError, setActionError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!isOpen || !request) return null;

  const handleStatusChange = async (targetStatus) => {
    setActionError(null);
    if (targetStatus === 'RESOLVED' && !resolutionNote.trim()) {
      setActionError('Resolution note is required when resolving a request.');
      return;
    }
    setLoadingAction(true);
    try {
      await updateMaintenanceStatus(request.id, targetStatus, resolutionNote);
      setResolutionNote('');
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to update status.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedAssignee) return;
    setActionError(null);
    setLoadingAction(true);
    try {
      await assignMaintenanceStaff(request.id, selectedAssignee);
      setSelectedAssignee('');
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to assign staff.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePriorityChange = async (e) => {
    e.preventDefault();
    if (!selectedPriority) return;
    setActionError(null);
    setLoadingAction(true);
    try {
      await updateMaintenancePriority(request.id, selectedPriority, 'Staff priority adjustment');
      setSelectedPriority('');
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to update priority.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setActionError(null);
    setLoadingAction(true);
    try {
      await addMaintenanceUpdate(request.id, newComment);
      setNewComment('');
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to add update.');
    } finally {
      setLoadingAction(false);
    }
  };

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

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content shadow">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">
              Maintenance Request #{request.id}: {request.title}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body">
            {actionError && (
              <div className="alert alert-danger p-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {actionError}
              </div>
            )}

            <div className="row g-4">
              {/* Left Column: Details & Actions */}
              <div className="col-12 col-lg-7 border-end-lg">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="me-2">{getStatusBadge(request.status)}</span>
                    <span>{getPriorityBadge(request.priority)}</span>
                    <span className="badge bg-light text-dark border ms-2">{request.category}</span>
                  </div>
                  <small className="text-muted">
                    Reported: {new Date(request.reported_at || request.created_at).toLocaleString()}
                  </small>
                </div>

                <div className="card bg-light border-0 p-3 mb-3">
                  <h6 className="font-weight-bold mb-1">Description</h6>
                  <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{request.description}</p>
                </div>

                {/* Location & Metadata */}
                <div className="row g-2 mb-3 small">
                  <div className="col-6 col-md-4">
                    <strong>Hostel:</strong> {request.hostel_name || 'N/A'}
                  </div>
                  <div className="col-6 col-md-4">
                    <strong>Room / Bed:</strong> {request.room_number ? `Room ${request.room_number}` : 'N/A'} {request.bed_number ? `(Bed ${request.bed_number})` : ''}
                  </div>
                  <div className="col-6 col-md-4">
                    <strong>Reported By:</strong> {request.student_name || request.reporter_name || 'N/A'}
                  </div>
                  <div className="col-6 col-md-4">
                    <strong>Assigned To:</strong> {request.assignee_name || <span className="text-muted">Unassigned</span>}
                  </div>
                  <div className="col-6 col-md-4">
                    <strong>Started At:</strong> {request.started_at ? new Date(request.started_at).toLocaleString() : 'Not started'}
                  </div>
                  <div className="col-6 col-md-4">
                    <strong>Resolved At:</strong> {request.resolved_at ? new Date(request.resolved_at).toLocaleString() : 'Unresolved'}
                  </div>
                </div>

                {request.resolution_note && (
                  <div className="alert alert-success p-2 small mb-3">
                    <strong>Resolution Note:</strong> {request.resolution_note}
                  </div>
                )}

                {/* Controls & Status Management */}
                <hr />
                <h6 className="font-weight-bold mb-2">Actions & Workflow</h6>

                {isStaff ? (
                  <div className="vstack gap-3">
                    {/* Staff Assignment */}
                    <form onSubmit={handleAssign} className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                      >
                        <option value="">Select Staff to Assign...</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.username} ({s.role})</option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-outline-primary btn-sm text-nowrap" disabled={loadingAction || !selectedAssignee}>
                        Assign
                      </button>
                    </form>

                    {/* Priority Change */}
                    <form onSubmit={handlePriorityChange} className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                      >
                        <option value="">Elevate / Change Priority...</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                      <button type="submit" className="btn btn-outline-warning btn-sm text-nowrap" disabled={loadingAction || !selectedPriority}>
                        Set Priority
                      </button>
                    </form>

                    {/* Status Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                      {request.status !== 'IN_PROGRESS' && request.status !== 'RESOLVED' && request.status !== 'CLOSED' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange('IN_PROGRESS')}
                          disabled={loadingAction}
                        >
                          Mark In Progress
                        </button>
                      )}

                      {request.status === 'RESOLVED' && (
                        <button
                          type="button"
                          className="btn btn-dark btn-sm"
                          onClick={() => handleStatusChange('CLOSED')}
                          disabled={loadingAction}
                        >
                          Close Request
                        </button>
                      )}
                    </div>

                    {/* Resolution Form */}
                    {request.status !== 'RESOLVED' && request.status !== 'CLOSED' && (
                      <div className="card p-2 bg-light border">
                        <label className="form-label small font-weight-bold mb-1">Resolve Request</label>
                        <textarea
                          className="form-control form-control-sm mb-2"
                          rows="2"
                          placeholder="Enter resolution notes (e.g. Replaced faulty wiring / fixed faucet)..."
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                        ></textarea>
                        <button
                          type="button"
                          className="btn btn-success btn-sm align-self-start"
                          onClick={() => handleStatusChange('RESOLVED')}
                          disabled={loadingAction || !resolutionNote.trim()}
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {request.status === 'RESOLVED' && (
                      <div className="mb-3">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm me-2"
                          onClick={() => handleStatusChange('REOPENED')}
                          disabled={loadingAction}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i>
                          Reopen Request (Issue Not Fixed)
                        </button>
                      </div>
                    )}
                    {request.status !== 'RESOLVED' && (
                      <p className="text-muted small">
                        Status changes are managed by hostel superintendents and maintenance staff. You will be notified when resolved.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Updates Timeline */}
              <div className="col-12 col-lg-5">
                <h6 className="font-weight-bold mb-3">Activity & Timeline History</h6>

                <div className="timeline-container pe-1" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {request.updates && request.updates.length > 0 ? (
                    <div className="vstack gap-2">
                      {request.updates.map((u) => (
                        <div key={u.id} className="p-2 border rounded bg-white shadow-sm small">
                          <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            <span><strong>{u.user_name}</strong> ({u.user_role})</span>
                            <span>{new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="mb-0 text-dark">{u.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small italic">No updates recorded yet.</div>
                  )}
                </div>

                {/* Add Comment Box */}
                <form onSubmit={handleAddComment} className="mt-3">
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add an update comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loadingAction || !newComment.trim()}>
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
