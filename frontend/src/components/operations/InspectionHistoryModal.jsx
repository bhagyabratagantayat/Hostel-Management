import React, { useEffect, useState } from 'react';
import { getRoomInspectionHistory } from '../../api/operations';

export default function InspectionHistoryModal({ isOpen, onClose, roomId }) {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && roomId) {
      setLoading(true);
      setError(null);
      getRoomInspectionHistory(roomId)
        .then(data => setHistoryData(data))
        .catch(err => setError(err.message || 'Failed to load room inspection history.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const renderBadge = (status) => {
    switch (status) {
      case 'CRITICAL': return <span className="badge bg-danger">CRITICAL</span>;
      case 'ATTENTION_REQUIRED': return <span className="badge bg-warning text-dark">ATTENTION REQUIRED</span>;
      default: return <span className="badge bg-success">GOOD</span>;
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">
              Room Inspection History {historyData?.room?.room_number ? `(Room ${historyData.room.room_number} - ${historyData.room.hostel_name})` : ''}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading room history...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger p-2 small mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {!loading && historyData && historyData.history && (
              historyData.history.length > 0 ? (
                <div className="timeline-list vstack gap-3">
                  {historyData.history.map(insp => (
                    <div key={insp.id} className="card border p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="font-weight-bold">
                          <i className="bi bi-calendar-check me-2"></i>
                          {new Date(insp.inspection_date).toLocaleDateString()}
                        </span>
                        <span className="small text-muted">Inspector: {insp.inspector_name}</span>
                      </div>

                      <div className="row g-2 small mb-2">
                        <div className="col-6 col-md-4">Cleanliness: {renderBadge(insp.cleanliness_status)}</div>
                        <div className="col-6 col-md-4">Electrical: {renderBadge(insp.electrical_status)}</div>
                        <div className="col-6 col-md-4">Plumbing: {renderBadge(insp.plumbing_status)}</div>
                        <div className="col-6 col-md-4">Furniture: {renderBadge(insp.furniture_status)}</div>
                        <div className="col-6 col-md-4">Beds: {renderBadge(insp.bed_status)}</div>
                        <div className="col-6 col-md-4">Safety: {renderBadge(insp.safety_status)}</div>
                      </div>

                      {insp.remarks && (
                        <div className="text-muted small mt-2 pt-2 border-top">
                          <strong>Remarks:</strong> {insp.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  No inspection history found for this room.
                </div>
              )
            )}
          </div>

          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
