import React from 'react';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', className: 'status-pill status-requested', icon: '' },
  APPROVED: { label: 'Approved', className: 'status-pill status-approved', icon: '' },
  CHECKED_IN: { label: 'Checked In', className: 'status-pill status-checked-in', icon: '' },
  CHECKED_OUT: { label: 'Checked Out', className: 'status-pill status-checked-out', icon: '' },
  CANCELLED: { label: 'Cancelled', className: 'status-pill status-cancelled', icon: '' },
  REJECTED: { label: 'Rejected', className: 'status-pill status-rejected', icon: '' }
};

const VISITOR_TYPE_BADGES = {
  PARENT: 'Parent',
  GUARDIAN: 'Guardian',
  RELATIVE: 'Relative',
  FRIEND: ' Friend',
  OFFICIAL: ' Official',
  OTHER: ' Visitor'
};

export default function VisitorCard({ visit, userRole, onViewDetails, onApprove, onReject, onCancel, onCheckIn, onCheckOut }) {
  const statusInfo = STATUS_CONFIG[visit.status] || { label: visit.status, className: 'status-pill', icon: '' };
  const isOverdue = Boolean(visit.is_overdue || (visit.status === 'CHECKED_IN' && new Date(visit.expected_check_out) < new Date()));

  const formatDate = (dt) => {
    if (!dt) return 'N/A';
    try {
      const d = new Date(dt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch (e) {
      return dt;
    }
  };

  return (
    <div className={`visitor-card ${isOverdue ? 'visitor-card-overdue' : ''}`}>
      <div className="visitor-card-header">
        <div className="visitor-primary-info">
          <span className="visitor-type-tag">{VISITOR_TYPE_BADGES[visit.visitor_type] || visit.visitor_type}</span>
          <h3 className="visitor-name">{visit.visitor_name}</h3>
        </div>
        <div className="visitor-status-container">
          {isOverdue && <span className="overdue-badge">️ OVERDUE</span>}
          <span className={statusInfo.className}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="visitor-card-body">
        <div className="visitor-meta-grid">
          <div className="visitor-meta-item">
            <span className="meta-label"> Contact</span>
            <span className="meta-value">{visit.visitor_phone}</span>
          </div>

          <div className="visitor-meta-item">
            <span className="meta-label"> ID Verification</span>
            <span className="meta-value">{visit.identification_type} (••••{visit.identification_last4})</span>
          </div>

          {userRole !== 'STUDENT' && (
            <div className="visitor-meta-item">
              <span className="meta-label"> Visiting Student</span>
              <span className="meta-value highlight-student">
                {visit.student_name} ({visit.student_code})
              </span>
              <span className="sub-meta">Room {visit.room_number || 'N/A'} - Bed {visit.bed_number || 'N/A'}</span>
            </div>
          )}

          <div className="visitor-meta-item">
            <span className="meta-label">Hostel</span>
            <span className="meta-value">{visit.hostel_name || 'Main Hostel'}</span>
          </div>
        </div>

        <div className="visitor-purpose">
          <span className="purpose-label">Purpose:</span> {visit.purpose}
        </div>

        <div className="visitor-timing-bar">
          <div className="timing-col">
            <span className="timing-title">Expected In</span>
            <span className="timing-time">{formatDate(visit.expected_check_in)}</span>
          </div>
          <div className="timing-arrow"></div>
          <div className="timing-col">
            <span className="timing-title">Expected Out</span>
            <span className="timing-time">{formatDate(visit.expected_check_out)}</span>
          </div>
          {visit.actual_check_in && (
            <div className="timing-col actual">
              <span className="timing-title">Actual In</span>
              <span className="timing-time">{formatDate(visit.actual_check_in)}</span>
            </div>
          )}
          {visit.actual_check_out && (
            <div className="timing-col actual">
              <span className="timing-title">Actual Out</span>
              <span className="timing-time">{formatDate(visit.actual_check_out)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="visitor-card-actions">
        <button
          type="button"
          className="btn-action btn-view"
          onClick={() => onViewDetails(visit.id)}
        >
           View Details
        </button>

        {/* Staff Actions */}
        {userRole !== 'STUDENT' && visit.status === 'REQUESTED' && (
          <>
            <button
              type="button"
              className="btn-action btn-approve"
              onClick={() => onApprove(visit.id)}
            >
              ✓ Approve
            </button>
            <button
              type="button"
              className="btn-action btn-reject"
              onClick={() => onReject(visit.id)}
            >
              ✕ Reject
            </button>
          </>
        )}

        {userRole !== 'STUDENT' && visit.status === 'APPROVED' && (
          <button
            type="button"
            className="btn-action btn-checkin"
            onClick={() => onCheckIn(visit.id)}
          >
             Check In
          </button>
        )}

        {userRole !== 'STUDENT' && visit.status === 'CHECKED_IN' && (
          <button
            type="button"
            className="btn-action btn-checkout"
            onClick={() => onCheckOut(visit.id)}
          >
             Check Out
          </button>
        )}

        {/* Student or Staff Cancel */}
        {(visit.status === 'REQUESTED' || visit.status === 'APPROVED') && (
          <button
            type="button"
            className="btn-action btn-cancel"
            onClick={() => onCancel(visit.id)}
          >
             Cancel
          </button>
        )}
      </div>
    </div>
  );
}
