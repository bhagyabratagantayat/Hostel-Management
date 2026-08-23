import React from 'react';

const ReportStatCard = ({ title, value, subtitle, icon, color = 'primary', loading = false }) => {
  if (loading) {
    return (
      <div className={`report-stat-card card variant-${color} skeleton-loading`}>
        <div className="skeleton-line title-sk"></div>
        <div className="skeleton-line val-sk"></div>
      </div>
    );
  }

  return (
    <div className={`report-stat-card card variant-${color}`}>
      <div className="report-stat-header">
        <span className="report-stat-title">{title}</span>
        {icon && <span className="report-stat-icon">{icon}</span>}
      </div>
      <div className="report-stat-value">{value}</div>
      {subtitle && <div className="report-stat-subtitle">{subtitle}</div>}
    </div>
  );
};

export default ReportStatCard;
