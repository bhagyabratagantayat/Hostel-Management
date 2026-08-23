import React from 'react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const FeeCard = ({
  fee,
  userRole,
  onRecordPayment,
  onViewDetails,
  onWaiveFee
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="status-pill status-active">PAID</span>;
      case 'PARTIAL':
        return <span className="status-pill status-partial">PARTIAL</span>;
      case 'OVERDUE':
        return <span className="status-pill status-overdue">OVERDUE</span>;
      case 'WAIVED':
        return <span className="status-pill status-waived">WAIVED</span>;
      case 'PENDING':
      default:
        return <span className="status-pill status-pending">PENDING</span>;
    }
  };

  const isStaff = userRole === 'SUPER_ADMIN' || userRole === 'SUPERINTENDENT';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div className={`fee-card-item ${fee.status === 'OVERDUE' ? 'border-overdue' : ''}`}>
      <div className="fee-card-header">
        <div>
          <h4 className="fee-card-title">{fee.fee_name || fee.fee_type || 'Hostel Fee'}</h4>
          <span className="fee-card-subtitle">{fee.academic_year} • {fee.frequency || 'YEARLY'}</span>
        </div>
        {getStatusBadge(fee.status)}
      </div>

      <div className="fee-card-body">
        {isStaff && (
          <div className="fee-card-row">
            <span className="label">Student:</span>
            <span className="value bold">{fee.student_name} ({fee.student_code})</span>
          </div>
        )}
        <div className="fee-card-row">
          <span className="label">Hostel & Room:</span>
          <span className="value">{fee.hostel_name} — Room {fee.room_number || 'N/A'}</span>
        </div>
        <div className="fee-card-row">
          <span className="label">Assigned Fee:</span>
          <span className="value bold">{formatCurrency(fee.amount)}</span>
        </div>
        <div className="fee-card-row">
          <span className="label">Paid So Far:</span>
          <span className="value text-success">{formatCurrency(fee.paid_amount)}</span>
        </div>
        <div className="fee-card-row">
          <span className="label">Remaining Dues:</span>
          <span className={`value bold ${fee.remaining_amount > 0 ? 'text-danger' : 'text-success'}`}>
            {formatCurrency(fee.remaining_amount)}
          </span>
        </div>
        <div className="fee-card-row">
          <span className="label">Due Date:</span>
          <span className="value">{new Date(fee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        {fee.status === 'WAIVED' && fee.waiver_reason && (
          <div className="fee-card-row waiver-info">
            <span className="label">Waiver Reason:</span>
            <span className="value italic">{fee.waiver_reason}</span>
          </div>
        )}
      </div>

      <div className="fee-card-actions">
        <button
          className="btn-action secondary"
          onClick={() => onViewDetails(fee.id)}
        >
          🔍 View History
        </button>

        {isStaff && fee.remaining_amount > 0 && fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
          <button
            className="btn-action primary"
            onClick={() => onRecordPayment(fee)}
          >
            💵 Record Payment
          </button>
        )}

        {isSuperAdmin && fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
          <button
            className="btn-action danger"
            onClick={() => onWaiveFee(fee)}
          >
            🛡️ Waive
          </button>
        )}
      </div>
    </div>
  );
};

export default FeeCard;
