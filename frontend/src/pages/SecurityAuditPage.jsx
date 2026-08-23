import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SecurityAuditPage.css';

const SecurityAuditPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalLogs(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch security audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action) => {
    if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('ACTIVATED')) return 'audit-success';
    if (action.includes('FAILED') || action.includes('DEACTIVATED')) return 'audit-danger';
    if (action.includes('PASSWORD') || action.includes('ROLE')) return 'audit-warning';
    return 'audit-info';
  };

  return (
    <div className="audit-page-container">
      <div className="audit-header">
        <div>
          <button className="btn btn-sm btn-secondary mb-2" onClick={() => navigate('/admin/users')}>
            ← Back to User Management
          </button>
          <h1>Centralized Security Audit Trail</h1>
          <p className="subtitle">Real-time log of security-sensitive system events, logins, role modifications, and password resets.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Toolbar */}
      <div className="audit-filters card mb-3">
        <select
          className="form-control"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Security Events</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
          <option value="PASSWORD_RESET">PASSWORD_RESET</option>
          <option value="ACCOUNT_ACTIVATED">ACCOUNT_ACTIVATED</option>
          <option value="ACCOUNT_DEACTIVATED">ACCOUNT_DEACTIVATED</option>
          <option value="ROLE_CHANGED">ROLE_CHANGED</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="HOSTEL_ASSIGNED">HOSTEL_ASSIGNED</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="table-responsive card">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Target Account</th>
              <th>Performed By</th>
              <th>IP Address</th>
              <th>User Agent</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">Loading security audit trail...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No audit log records found.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td className="timestamp-cell">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className={`audit-badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.target_username ? (
                      <span>{log.target_username} <small className="text-muted">({log.target_email})</small></span>
                    ) : (
                      <em className="text-muted">N/A</em>
                    )}
                  </td>
                  <td>
                    {log.actor_username ? (
                      <span>{log.actor_username}</span>
                    ) : (
                      <em className="text-muted">System / Self</em>
                    )}
                  </td>
                  <td><code>{log.ip_address || 'Unknown'}</code></td>
                  <td className="ua-cell" title={log.user_agent}>
                    {log.user_agent ? log.user_agent.slice(0, 30) + '...' : 'N/A'}
                  </td>
                  <td>
                    {log.metadata && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar mt-3">
          <span>Page {page} of {totalPages} ({totalLogs} events recorded)</span>
          <div className="pagination-controls">
            <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn btn-sm btn-secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Audit Event Metadata</h2>
              <button className="close-btn" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="modal-body">
              <pre className="metadata-json">
                {JSON.stringify(typeof selectedLog.metadata === 'string' ? JSON.parse(selectedLog.metadata) : selectedLog.metadata, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAuditPage;
