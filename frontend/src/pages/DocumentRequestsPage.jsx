import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DocumentRequestsPage.css';

const DOC_TYPES = [
  { value: 'HOSTEL_BONAFIDE', label: 'Hostel Bonafide Certificate' },
  { value: 'FEE_STRUCTURE', label: 'Hostel Fee Structure Certificate' },
  { value: 'NO_DUES', label: 'No Dues Clearance Certificate' },
  { value: 'HOSTEL_RESIDENCE', label: 'Hostel Residence Proof' },
  { value: 'CHARACTER_CERTIFICATE', label: 'Hostel Conduct & Character Certificate' }
];

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, issued: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('STUDENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form states
  const [applyForm, setApplyForm] = useState({
    document_type: 'HOSTEL_BONAFIDE',
    purpose: '',
    academic_session: '2026-2027',
    copies_requested: 1,
    remarks: ''
  });

  const [issueRemarks, setIssueRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Determine user role from stored user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserRole(u.role || 'STUDENT');
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.document_type = typeFilter;
      if (searchTerm) filters.search = searchTerm;

      const [reqRes, statsRes] = await Promise.all([
        api.getDocumentRequests(filters),
        api.getDocumentStats()
      ]);

      setRequests(reqRes.data || []);
      setStats(statsRes.data || { pending: 0, issued: 0, rejected: 0, total: 0 });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load document requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.requestDocument(applyForm);
      setSuccessMsg('Document / Certificate request submitted successfully!');
      setShowApplyModal(false);
      setApplyForm({
        document_type: 'HOSTEL_BONAFIDE',
        purpose: '',
        academic_session: '2026-2027',
        copies_requested: 1,
        remarks: ''
      });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit document request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.approveAndIssueDocument(selectedDoc.id, issueRemarks);
      setSuccessMsg(`Certificate ${selectedDoc.request_number} issued successfully!`);
      setShowIssueModal(false);
      setSelectedDoc(null);
      setIssueRemarks('');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to issue certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.rejectDocumentRequest(selectedDoc.id, rejectionReason);
      setSuccessMsg(`Document Request ${selectedDoc.request_number} rejected.`);
      setShowRejectModal(false);
      setSelectedDoc(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this document request?')) return;
    try {
      await api.cancelDocumentRequest(id);
      setSuccessMsg('Document request cancelled.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel request.');
    }
  };

  const openIssueModal = (doc) => {
    setSelectedDoc(doc);
    setIssueRemarks('Verified student records and fee clearance. Digital certificate issued.');
    setShowIssueModal(true);
  };

  const openRejectModal = (doc) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const openDetailModal = (doc) => {
    setSelectedDoc(doc);
    setShowDetailModal(true);
  };

  return (
    <div className="doc-requests-container">
      {/* Banner Header */}
      <div className="doc-header-card">
        <div className="doc-header-content">
          <h1>📄 Certificate & Document Portal</h1>
          <p>Request official hostel bonafide, fee structure, and residence clearance certificates digitally.</p>
        </div>
        {userRole === 'STUDENT' && (
          <button className="btn-request-primary" onClick={() => setShowApplyModal(true)}>
            ➕ Request New Certificate
          </button>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '1rem', fontWeight: 600 }}>⚠️ {errorMsg}</div>}
      {successMsg && <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '1rem', fontWeight: 600 }}>✅ {successMsg}</div>}

      {/* Statistics Cards */}
      <div className="doc-stats-grid">
        <div className="doc-stat-card pending">
          <div className="stat-info">
            <h3>Pending Verification</h3>
            <div className="stat-number">{stats.pending || 0}</div>
          </div>
          <div className="stat-icon-wrapper">⏳</div>
        </div>
        <div className="doc-stat-card issued">
          <div className="stat-info">
            <h3>Issued Certificates</h3>
            <div className="stat-number">{stats.issued || 0}</div>
          </div>
          <div className="stat-icon-wrapper">📜</div>
        </div>
        <div className="doc-stat-card rejected">
          <div className="stat-info">
            <h3>Rejected Requests</h3>
            <div className="stat-number">{stats.rejected || 0}</div>
          </div>
          <div className="stat-icon-wrapper">❌</div>
        </div>
        <div className="doc-stat-card total">
          <div className="stat-info">
            <h3>Total Applications</h3>
            <div className="stat-number">{stats.total || 0}</div>
          </div>
          <div className="stat-icon-wrapper">📁</div>
        </div>
      </div>

      {/* Filter and Controls */}
      <div className="doc-controls-card">
        <form onSubmit={handleSearchSubmit} className="doc-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Request #, Cert #, Student Name, Roll No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="doc-filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ISSUED">Issued</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Document Types</option>
            {DOC_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="doc-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading document requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No document requests found.</div>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Request Details</th>
                <th>Student Information</th>
                <th>Document Type</th>
                <th>Status</th>
                <th>Certificate Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{doc.request_number}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Requested: {new Date(doc.created_at).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{doc.student_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{doc.roll_number} ({doc.hostel_code || doc.hostel_name || 'Hostel'})</div>
                  </td>
                  <td>
                    <span className="doc-type-tag">
                      {DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${doc.status}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td>
                    {doc.certificate_number ? (
                      <span className="cert-num-chip">📜 {doc.certificate_number}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Not Issued</span>
                    )}
                  </td>
                  <td>
                    <div className="doc-actions">
                      <button className="btn-view" onClick={() => openDetailModal(doc)}>
                        👁️ View
                      </button>

                      {userRole !== 'STUDENT' && doc.status === 'PENDING' && (
                        <>
                          <button className="btn-issue" onClick={() => openIssueModal(doc)}>
                            ✅ Issue
                          </button>
                          <button className="btn-reject" onClick={() => openRejectModal(doc)}>
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {userRole === 'STUDENT' && doc.status === 'PENDING' && (
                        <button className="btn-cancel" onClick={() => handleCancelRequest(doc.id)}>
                          🚫 Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Modal (Student) */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📄 Request Official Certificate</h2>
              <button className="btn-close" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleApplySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Document / Certificate Type *</label>
                  <select
                    value={applyForm.document_type}
                    onChange={(e) => setApplyForm({ ...applyForm, document_type: e.target.value })}
                    required
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Academic Session</label>
                  <input
                    type="text"
                    value={applyForm.academic_session}
                    onChange={(e) => setApplyForm({ ...applyForm, academic_session: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Purpose of Document Request *</label>
                  <textarea
                    rows="3"
                    placeholder="E.g., Bank Education Loan, Scholarship Application, Passport Verification..."
                    value={applyForm.purpose}
                    onChange={(e) => setApplyForm({ ...applyForm, purpose: e.target.value })}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal (Admin) */}
      {showIssueModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📜 Approve & Issue Certificate</h2>
              <button className="btn-close" onClick={() => setShowIssueModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="modal-body">
                <p>You are issuing official certificate for <strong>{selectedDoc.student_name}</strong> ({selectedDoc.roll_number}).</p>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                  <div><strong>Request No:</strong> {selectedDoc.request_number}</div>
                  <div><strong>Type:</strong> {DOC_TYPES.find(t => t.value === selectedDoc.document_type)?.label}</div>
                  <div><strong>Purpose:</strong> {selectedDoc.purpose}</div>
                </div>

                <div className="form-group">
                  <label>Warden Approval Remarks</label>
                  <textarea
                    rows="3"
                    value={issueRemarks}
                    onChange={(e) => setIssueRemarks(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit" className="btn-issue" disabled={submitting}>
                  {submitting ? 'Issuing...' : '✅ Generate & Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal (Admin) */}
      {showRejectModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>❌ Reject Document Request</h2>
              <button className="btn-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    rows="3"
                    placeholder="Specify why this document request cannot be approved..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button type="submit" className="btn-reject" disabled={submitting}>
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Official Certificate Print Preview Modal */}
      {showDetailModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>📜 Certificate & Request Details</h2>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedDoc.status === 'ISSUED' ? (
                <div className="certificate-preview-box">
                  <div className="cert-header">
                    <div className="cert-college">BHUBANESHWAR ENGINEERING COLLEGE (BEC)</div>
                    <div className="cert-sub">OFFICE OF THE HOSTEL SUPERINTENDENT</div>
                    <div className="cert-title">
                      {DOC_TYPES.find(t => t.value === selectedDoc.document_type)?.label.toUpperCase()}
                    </div>
                  </div>

                  <div className="cert-meta-row">
                    <div>Ref No: {selectedDoc.certificate_number}</div>
                    <div>Date: {new Date(selectedDoc.issued_at || selectedDoc.updated_at).toLocaleDateString()}</div>
                  </div>

                  <div className="cert-body-text">
                    This is to certify that <strong>{selectedDoc.student_name}</strong> (Roll No: <strong>{selectedDoc.roll_number}</strong>), pursuing <strong>{selectedDoc.course || 'B.Tech'} ({selectedDoc.branch || 'Engineering'})</strong>, is a bona-fide resident student of <strong>{selectedDoc.hostel_name || 'BEC Hostel'}</strong>, assigned Room No. <strong>{selectedDoc.room_number || 'N/A'}</strong> (Bed: {selectedDoc.bed_number || 'N/A'}) for the academic session <strong>{selectedDoc.academic_session || '2026-2027'}</strong>.
                    <br /><br />
                    This certificate is issued upon student's request for the purpose of: <em>"{selectedDoc.purpose}"</em>.
                  </div>

                  <div className="cert-footer-row">
                    <div className="cert-stamp">
                      ✓ DIGITALLY VERIFIED & ISSUED BY BEC HOSTEL AUTHORITY
                    </div>
                    <div className="cert-signature">
                      Hostel Superintendent / Warden<br />
                      BEC Bhubaneswar
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', fontFit: 'contain' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Application Details</h3>
                    <div><strong>Request Number:</strong> {selectedDoc.request_number}</div>
                    <div><strong>Document Type:</strong> {DOC_TYPES.find(t => t.value === selectedDoc.document_type)?.label}</div>
                    <div><strong>Purpose:</strong> {selectedDoc.purpose}</div>
                    <div><strong>Status:</strong> <span className={`badge-status ${selectedDoc.status}`}>{selectedDoc.status}</span></div>
                    {selectedDoc.rejection_reason && (
                      <div style={{ color: '#dc2626', marginTop: '0.5rem' }}><strong>Rejection Reason:</strong> {selectedDoc.rejection_reason}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedDoc.status === 'ISSUED' && (
                <button type="button" className="btn-print" onClick={() => window.print()}>
                  🖨️ Print / Download Certificate
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
