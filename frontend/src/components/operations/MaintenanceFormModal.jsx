import React, { useState, useEffect } from 'react';
import { createMaintenanceRequest } from '../../api/operations';
import '../../pages/MaintenancePage.css';

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
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div 
        className="modal-dialog-custom" 
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" 
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header-custom">
          <h2 className="modal-title-custom">
            <span> {prefill ? 'Create Maintenance from Inspection' : 'Submit Maintenance Request'}</span>
          </h2>
          <button 
            type="button" 
            className="modal-close-btn-custom" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body-custom">
            {error && (
              <div className="alert-error-custom">
                <span>️</span>
                <div>{error}</div>
              </div>
            )}

            {/* Title & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Issue Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="filter-search-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Broken ceiling fan / Leaking tap"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Detailed Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="resolution-textarea"
                rows="3"
                placeholder="Provide detailed description of the physical maintenance or repair required..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Priority & Hostel (if Staff) */}
            <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  {isStaff && <option value="URGENT">URGENT (Staff Elevation)</option>}
                </select>
                {!isStaff && (
                  <small style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                    Students can set Low/Medium/High. Staff will elevate to Urgent if needed.
                  </small>
                )}
              </div>

              {isStaff && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Hostel <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
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
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                Location details (Hostel, Room, Bed) will be automatically assigned from your current active room allocation.
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer-custom">
            <button 
              type="button" 
              className="filter-reset-btn"
              onClick={onClose} 
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-gradient"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Maintenance Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
