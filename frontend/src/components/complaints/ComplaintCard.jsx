import React from 'react';

const CATEGORY_ICONS = {
  ROOM: '',
  ELECTRICITY: '',
  WATER: '',
  PLUMBING: '',
  CLEANLINESS: '',
  FAN_AC: '️',
  FURNITURE: '',
  FOOD_MESS: '',
  INTERNET: '',
  SECURITY: '',
  MAINTENANCE: '',
  OTHER: ''
};

const PRIORITY_BADGES = {
  LOW: { label: 'Low', className: 'priority-tag priority-low' },
  MEDIUM: { label: 'Medium', className: 'priority-tag priority-medium' },
  HIGH: { label: 'High', className: 'priority-tag priority-high' },
  URGENT: { label: 'URGENT', className: 'priority-tag priority-urgent' }
};

const STATUS_BADGES = {
  OPEN: { label: 'Open', className: 'status-pill status-open' },
  IN_PROGRESS: { label: 'In Progress', className: 'status-pill status-progress' },
  RESOLVED: { label: 'Resolved', className: 'status-pill status-resolved' },
  CLOSED: { label: 'Closed', className: 'status-pill status-closed' },
  REOPENED: { label: 'Reopened', className: 'status-pill status-reopened' }
};

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = new Date() - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ComplaintCard = ({ complaint, onClick, userRole }) => {
  const categoryIcon = CATEGORY_ICONS[complaint.category] || '';
  const priorityInfo = PRIORITY_BADGES[complaint.priority] || PRIORITY_BADGES.MEDIUM;
  const statusInfo = STATUS_BADGES[complaint.status] || STATUS_BADGES.OPEN;

  return (
    <div 
      className={`complaint-card ${complaint.priority === 'URGENT' ? 'urgent-border' : ''}`}
      onClick={() => onClick(complaint)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(complaint)}
    >
      <div className="complaint-card-header">
        <div className="complaint-card-meta">
          <span className="category-icon" title={complaint.category}>{categoryIcon}</span>
          <span className="category-label">{complaint.category?.replace('_', ' ')}</span>
          <span className={priorityInfo.className}>{priorityInfo.label}</span>
        </div>
        <span className={statusInfo.className}>{statusInfo.label}</span>
      </div>

      <h3 className="complaint-card-title">{complaint.title}</h3>
      <p className="complaint-card-desc">{complaint.description}</p>

      <div className="complaint-card-footer">
        <div className="complaint-card-info">
          {userRole !== 'STUDENT' && (
            <span className="complaint-student">
               {complaint.student_name} ({complaint.hostel_name || 'Hostel'}, Rm {complaint.room_number || 'N/A'})
            </span>
          )}
          {userRole === 'STUDENT' && (
            <span className="complaint-location">
               {complaint.hostel_name} • Rm {complaint.room_number || 'N/A'}
            </span>
          )}
        </div>
        <span className="complaint-time">{formatRelativeTime(complaint.created_at)}</span>
      </div>
    </div>
  );
};

export default ComplaintCard;
