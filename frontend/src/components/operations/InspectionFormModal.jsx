import React, { useState, useEffect } from 'react';
import { createInspection } from '../../api/operations';

const CONDITION_OPTIONS = [
  { value: 'GOOD', label: 'Good (Normal)', badgeClass: 'bg-success' },
  { value: 'ATTENTION_REQUIRED', label: 'Attention Required', badgeClass: 'bg-warning text-dark' },
  { value: 'CRITICAL', label: 'Critical Issue', badgeClass: 'bg-danger' }
];

export default function InspectionFormModal({
  isOpen,
  onClose,
  onSuccess,
  hostels = [],
  onOpenMaintenanceWithPrefill
}) {
  const [formData, setFormData] = useState({
    hostel_id: '',
    floor_id: '',
    room_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    cleanliness_status: 'GOOD',
    electrical_status: 'GOOD',
    plumbing_status: 'GOOD',
    furniture_status: 'GOOD',
    bed_status: 'GOOD',
    safety_status: 'GOOD',
    remarks: ''
  });
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch floors when hostel_id changes
  useEffect(() => {
    if (!isOpen) return;
    if (formData.hostel_id) {
      const selectedHostel = hostels.find(h => String(h.id) === String(formData.hostel_id));
      if (selectedHostel && selectedHostel.floors) {
        setFloors(selectedHostel.floors);
      } else {
        setFloors(prev => (prev.length > 0 ? [] : prev));
      }
    } else {
      setFloors(prev => (prev.length > 0 ? [] : prev));
      setRooms(prev => (prev.length > 0 ? [] : prev));
    }
  }, [formData.hostel_id, hostels, isOpen]);

  // Fetch rooms when floor_id changes
  useEffect(() => {
    if (!isOpen) return;
    if (formData.floor_id) {
      const selectedFloor = floors.find(f => String(f.id) === String(formData.floor_id));
      if (selectedFloor && selectedFloor.rooms) {
        setRooms(selectedFloor.rooms);
      } else {
        setRooms(prev => (prev.length > 0 ? [] : prev));
      }
    } else {
      setRooms(prev => (prev.length > 0 ? [] : prev));
    }
  }, [formData.floor_id, floors, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await createInspection(formData);
      onSuccess();
      
      // Check if any critical/attention condition exists and offer to create maintenance request
      const hasCriticalOrAttention = [
        formData.cleanliness_status,
        formData.electrical_status,
        formData.plumbing_status,
        formData.furniture_status,
        formData.bed_status,
        formData.safety_status
      ].some(s => s !== 'GOOD');

      if (hasCriticalOrAttention && onOpenMaintenanceWithPrefill) {
        const categoryMap = {
          ELECTRICAL: formData.electrical_status !== 'GOOD',
          PLUMBING: formData.plumbing_status !== 'GOOD',
          FURNITURE: formData.furniture_status !== 'GOOD',
          BED: formData.bed_status !== 'GOOD',
          CLEANING: formData.cleanliness_status !== 'GOOD',
          SAFETY: formData.safety_status !== 'GOOD'
        };
        const activeCategory = Object.keys(categoryMap).find(k => categoryMap[k]) || 'ROOM';

        if (window.confirm('Inspection saved! Would you like to create a Maintenance Request for the identified issue(s)?')) {
          onOpenMaintenanceWithPrefill({
            category: activeCategory,
            hostel_id: formData.hostel_id,
            floor_id: formData.floor_id,
            room_id: formData.room_id,
            title: `Inspection Issue: ${activeCategory} in Room ${formData.room_id}`,
            description: `Reported during room inspection on ${formData.inspection_date}. Remarks: ${formData.remarks || 'None'}`
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit room inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRadioGroup = (key, label) => (
    <div className="mb-3 border-bottom pb-2" key={key}>
      <label className="form-label font-weight-bold d-block mb-1">{label}</label>
      <div className="btn-group btn-group-sm w-100" role="group" aria-label={label}>
        {CONDITION_OPTIONS.map(opt => (
          <React.Fragment key={opt.value}>
            <input
              type="radio"
              className="btn-check"
              name={key}
              id={`${key}-${opt.value}`}
              value={opt.value}
              checked={formData[key] === opt.value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
            <label className={`btn ${formData[key] === opt.value ? opt.badgeClass : 'btn-outline-secondary'}`} htmlFor={`${key}-${opt.value}`}>
              {opt.label}
            </label>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">
              <i className="bi bi-clipboard-check me-2"></i>
              New Room Inspection Checklist
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div className="alert alert-danger p-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Location Selectors */}
              <div className="row g-3 mb-3 bg-light p-3 rounded border">
                <div className="col-12 col-md-4">
                  <label className="form-label font-weight-bold">Hostel <span className="text-danger">*</span></label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.hostel_id}
                    onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value, floor_id: '', room_id: '' })}
                    required
                  >
                    <option value="">Select Hostel</option>
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-4">
                  <label className="form-label font-weight-bold">Floor ID <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Floor ID"
                    value={formData.floor_id}
                    onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                    required
                  />
                </div>

                <div className="col-6 col-md-4">
                  <label className="form-label font-weight-bold">Room ID <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Room ID"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <h6 className="font-weight-bold mb-3 text-primary">Inspection Health Checklist</h6>
              {renderRadioGroup('cleanliness_status', '1. Room Cleanliness')}
              {renderRadioGroup('electrical_status', '2. Electrical Fittings & Appliances')}
              {renderRadioGroup('plumbing_status', '3. Plumbing & Water Supply')}
              {renderRadioGroup('furniture_status', '4. Furniture & Doors/Windows')}
              {renderRadioGroup('bed_status', '5. Beds & Mattresses')}
              {renderRadioGroup('safety_status', '6. Safety & Fire Precautions')}

              {/* Remarks */}
              <div className="mt-3">
                <label className="form-label font-weight-bold">Inspector Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Optional observations or maintenance action suggestions..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-dark" disabled={submitting}>
                {submitting ? 'Saving Inspection...' : 'Save Room Inspection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
