import React, { useState, useEffect } from 'react';
import { createMaintenanceRequest } from '../../api/operations';

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'FURNITURE', 'BED', 'ROOM',
  'BATHROOM', 'CLEANING', 'INTERNET', 'SAFETY', 'OTHER'
];

export default function MaintenanceFormModal({
  isOpen,
  onClose,
  onSuccess,
  isStaff = false,
  hostels = [],
  prefill = null
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    hostel_id: '',
    floor_id: '',
    room_id: '',
    bed_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prefill) {
      setFormData(prev => ({
        ...prev,
        category: prefill.category || 'OTHER',
        hostel_id: prefill.hostel_id || '',
        floor_id: prefill.floor_id || '',
        room_id: prefill.room_id || '',
        title: prefill.title || '',
        description: prefill.description || ''
      }));
    }
  }, [prefill]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createMaintenanceRequest(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-tools me-2"></i>
              {prefill ? 'Create Maintenance from Inspection' : 'Submit Maintenance Request'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger p-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Title & Category */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-8">
                  <label className="form-label font-weight-bold">Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Broken ceiling fan / Leaking bathroom tap"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label font-weight-bold">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label font-weight-bold">Description <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Provide detailed description of the physical maintenance issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>

              {/* Priority */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label font-weight-bold">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    {isStaff && <option value="URGENT">URGENT (Staff Elevation)</option>}
                  </select>
                  {!isStaff && (
                    <small className="text-muted d-block mt-1">
                      Students can select LOW, MEDIUM, or HIGH. Staff will elevate to URGENT if required.
                    </small>
                  )}
                </div>

                {/* Location fields for staff */}
                {isStaff && (
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Hostel <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={formData.hostel_id}
                      onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                      required={isStaff}
                    >
                      <option value="">Select Hostel</option>
                      {hostels.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!isStaff && (
                <div className="alert alert-info p-2 small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Location details (Hostel, Room, Bed) will be automatically attached from your current active room allocation.
                </div>
              )}
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : 'Submit Maintenance Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
