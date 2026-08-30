import React from 'react';
import './NoticeCard.css';

/**
 * Priority badge helper
 */
const PriorityBadge = ({ priority }) => {
  const normalized = (priority || 'GENERAL').toUpperCase();
  let label = 'GENERAL';
  let icon = '';
  let className = 'priority-general';

  if (normalized === 'URGENT') {
    label = 'URGENT';
    icon = '';
    className = 'priority-urgent';
  } else if (normalized === 'IMPORTANT') {
    label = 'IMPORTANT';
    icon = '️';
    className = 'priority-important';
  }

  return (
    <span className={`notice-priority-badge ${className}`}>
      <span className="priority-icon" aria-hidden="true">{icon}</span>
      <span className="priority-text">{label}</span>
    </span>
  );
};

/**
 * Status badge helper (for admin/staff)
 */
const StatusBadge = ({ status }) => {
  const norm = (status || 'DRAFT').toUpperCase();
  return (
    <span className={`notice-status-badge status-${norm.toLowerCase()}`}>
      {norm}
    </span>
  );
};

const NoticeCard = ({
  notice,
  userRole,
  onView,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  if (!notice) return null;

  const isStudent = userRole === 'STUDENT';
  const isUnread = isStudent && notice.is_read === false;

  // Format date cleanly (e.g. 23 Aug 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unpublished';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const targetLabel = notice.hostel_id === null
    ? ' All Hostels'
    : ` ${notice.hostel_name || `Hostel #${notice.hostel_id}`}`;

  return (
    <div className={`notice-card ${isUnread ? 'unread-card' : ''}`}>
      <div className="notice-card-header">
        <div className="notice-meta-left">
          <PriorityBadge priority={notice.priority} />

          {isStudent && (
            <span className={`read-state-badge ${isUnread ? 'unread' : 'read'}`}>
              <span className="read-state-dot" />
              {isUnread ? 'UNREAD' : 'READ'}
            </span>
          )}

          {!isStudent && notice.status && (
            <StatusBadge status={notice.status} />
          )}
        </div>

        <span className="notice-target-tag">{targetLabel}</span>
      </div>

      <div className="notice-card-body">
        <h3 className="notice-title" onClick={() => onView && onView(notice)}>
          {notice.title}
        </h3>
        
        <p className="notice-description-snippet">
          {notice.description}
        </p>
      </div>

      <div className="notice-card-footer">
        <div className="notice-timestamps">
          <span className="notice-date">
            <span className="calendar-icon"></span> {formatDate(notice.published_at || notice.created_at)}
          </span>
          {notice.expires_at && (
            <span className="notice-expiration" title="Expiration date">
               Expires {formatDate(notice.expires_at)}
            </span>
          )}
        </div>

        <div className="notice-actions">
          <button
            type="button"
            className="notice-btn btn-view"
            onClick={() => onView && onView(notice)}
            aria-label={`View notice ${notice.title}`}
          >
            View Details
          </button>

          {!isStudent && (
            <>
              {onEdit && (
                <button
                  type="button"
                  className="notice-btn btn-edit"
                  onClick={() => onEdit(notice)}
                  title="Edit Notice"
                >
                  Edit
                </button>
              )}

              {onStatusChange && notice.status === 'DRAFT' && (
                <button
                  type="button"
                  className="notice-btn btn-publish"
                  onClick={() => onStatusChange(notice.id, 'PUBLISHED')}
                  title="Publish Notice"
                >
                   Publish
                </button>
              )}

              {onStatusChange && notice.status === 'PUBLISHED' && (
                <button
                  type="button"
                  className="notice-btn btn-archive"
                  onClick={() => onStatusChange(notice.id, 'ARCHIVED')}
                  title="Archive Notice"
                >
                   Archive
                </button>
              )}

              {onDelete && userRole === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  className="notice-btn btn-delete"
                  onClick={() => onDelete(notice.id)}
                  title="Delete Notice"
                >
                  ️
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeCard;
