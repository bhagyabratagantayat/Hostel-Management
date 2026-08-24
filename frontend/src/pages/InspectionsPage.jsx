import React, { useState, useEffect } from 'react';
import { getInspections } from '../api/operations';
import InspectionFormModal from '../components/operations/InspectionFormModal';
import InspectionHistoryModal from '../components/operations/InspectionHistoryModal';
import MaintenanceFormModal from '../components/operations/MaintenanceFormModal';

export default function InspectionsPage({ role = 'SUPER_ADMIN' }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    hostel_id: '',
    condition: '',
    date_from: '',
    date_to: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const [isInspFormOpen, setIsInspFormOpen] = useState(false);
  const [selectedHistoryRoomId, setSelectedHistoryRoomId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [prefillMaint, setPrefillMaint] = useState(null);
  const [isMaintFormOpen, setIsMaintFormOpen] = useState(false);

  const loadInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInspections(filters);
      setInspections(data.inspections || []);
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total
      });
    } catch (err) {
      setError(err.message || 'Failed to load room inspections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [filters]);

  const renderBadge = (status) => {
    switch (status) {
      case 'CRITICAL': return <span className="badge bg-danger">CRITICAL</span>;
      case 'ATTENTION_REQUIRED': return <span className="badge bg-warning text-dark">ATTENTION REQUIRED</span>;
      default: return <span className="badge bg-success">GOOD</span>;
    }
  };

  const calculateOverallCondition = (insp) => {
    const conds = [
      insp.cleanliness_status,
      insp.electrical_status,
      insp.plumbing_status,
      insp.furniture_status,
      insp.bed_status,
      insp.safety_status
    ];
    if (conds.includes('CRITICAL')) return 'CRITICAL';
    if (conds.includes('ATTENTION_REQUIRED')) return 'ATTENTION_REQUIRED';
    return 'GOOD';
  };

  const openHistory = (roomId) => {
    setSelectedHistoryRoomId(roomId);
    setIsHistoryOpen(true);
  };

  const handleOpenMaintenancePrefill = (prefillData) => {
    setPrefillMaint(prefillData);
    setIsMaintFormOpen(true);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h4 font-weight-bold mb-1">
            <i className="bi bi-clipboard-check text-dark me-2"></i>
            Room Health & Inspection Center
          </h2>
          <p className="text-muted small mb-0">
            Conduct daily/weekly room health checklists and track physical asset conditions across hostels.
          </p>
        </div>

        <button
          className="btn btn-dark"
          onClick={() => setIsInspFormOpen(true)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Record Room Inspection
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm p-3 mb-4 border">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search hostel, room number, inspector..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.condition || ''}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value, page: 1 })}
            >
              <option value="">All Health Statuses</option>
              <option value="CRITICAL">Critical Issues Only</option>
              <option value="ATTENTION_REQUIRED">Attention Required Only</option>
              <option value="GOOD">Good Condition Only</option>
            </select>
          </div>

          <div className="col-6 col-md-2 text-end ms-auto">
            <button
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => setFilters({ page: 1, limit: 20, search: '', hostel_id: '', condition: '', date_from: '', date_to: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger p-3 mb-4">
          <i className="bi bi-exclamation-octagon me-2"></i>
          {error}
        </div>
      )}

      {/* Inspections List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
          <p className="mt-2 text-muted">Loading room inspections...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <i className="bi bi-clipboard-x text-muted display-4 mb-3"></i>
          <h5>No Inspection Records Found</h5>
          <p className="text-muted small">No room inspections match your current filter settings.</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {inspections.map(insp => {
              const overall = calculateOverallCondition(insp);
              return (
                <div key={insp.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card shadow-sm border h-100">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        <i className="bi bi-door-closed me-1"></i>
                        Room {insp.room_number} ({insp.hostel_code || insp.hostel_name})
                      </span>
                      {renderBadge(overall)}
                    </div>

                    <div className="card-body">
                      <div className="small text-muted mb-2">
                        <span>Inspector: <strong>{insp.inspector_name}</strong></span>
                        <span className="float-end">{new Date(insp.inspection_date).toLocaleDateString()}</span>
                      </div>

                      <div className="row g-2 small mb-3">
                        <div className="col-6">Cleanliness: {renderBadge(insp.cleanliness_status)}</div>
                        <div className="col-6">Electrical: {renderBadge(insp.electrical_status)}</div>
                        <div className="col-6">Plumbing: {renderBadge(insp.plumbing_status)}</div>
                        <div className="col-6">Furniture: {renderBadge(insp.furniture_status)}</div>
                        <div className="col-6">Beds: {renderBadge(insp.bed_status)}</div>
                        <div className="col-6">Safety: {renderBadge(insp.safety_status)}</div>
                      </div>

                      {insp.remarks && (
                        <p className="text-muted small bg-light p-2 rounded mb-0">
                          <strong>Remarks:</strong> {insp.remarks}
                        </p>
                      )}
                    </div>

                    <div className="card-footer bg-white border-top-0 d-flex justify-content-between gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => openHistory(insp.room_id)}
                      >
                        <i className="bi bi-clock-history me-1"></i>
                        View History
                      </button>

                      {overall !== 'GOOD' && (
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill text-nowrap"
                          onClick={() => handleOpenMaintenancePrefill({
                            category: insp.plumbing_status !== 'GOOD' ? 'PLUMBING' : (insp.electrical_status !== 'GOOD' ? 'ELECTRICAL' : 'ROOM'),
                            hostel_id: insp.hostel_id,
                            floor_id: insp.floor_id,
                            room_id: insp.room_id,
                            title: `Inspection Issue: Room ${insp.room_number}`,
                            description: `Created from room inspection on ${new Date(insp.inspection_date).toLocaleDateString()}. Remarks: ${insp.remarks || 'N/A'}`
                          })}
                        >
                          <i className="bi bi-tools me-1"></i>
                          Report Maintenance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total inspections)
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

      {/* Inspection Form Modal */}
      <InspectionFormModal
        isOpen={isInspFormOpen}
        onClose={() => setIsInspFormOpen(false)}
        onSuccess={loadInspections}
        onOpenMaintenanceWithPrefill={handleOpenMaintenancePrefill}
      />

      {/* Room History Modal */}
      <InspectionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => { setIsHistoryOpen(false); setSelectedHistoryRoomId(null); }}
        roomId={selectedHistoryRoomId}
      />

      {/* Maintenance Form Modal for Prefill */}
      <MaintenanceFormModal
        isOpen={isMaintFormOpen}
        onClose={() => { setIsMaintFormOpen(false); setPrefillMaint(null); }}
        onSuccess={loadInspections}
        isStaff={true}
        prefill={prefillMaint}
      />
    </div>
  );
}
