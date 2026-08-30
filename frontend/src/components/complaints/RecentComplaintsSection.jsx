import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ComplaintCard from './ComplaintCard';
import ComplaintDetailsModal from './ComplaintDetailsModal';

const RecentComplaintsSection = ({ user, complaintsPath = '/admin/complaints' }) => {
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [listRes, summaryRes] = await Promise.all([
        api.getComplaints({ limit: 4 }),
        api.getComplaintSummary()
      ]);
      if (listRes.success) setComplaints(listRes.data || []);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load dashboard complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="dashboard-section complaints-dashboard-section">
      <div className="section-header flex-between mb-4">
        <div>
          <h2 className="section-title">Complaint & Grievance Summary</h2>
          <p className="section-sub">Track active maintenance requests and issues</p>
        </div>
        <Link to={complaintsPath} className="btn btn-sm btn-outline-primary">
          View All Complaints ➔
        </Link>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="summary-cards-grid mb-4">
          <div className="summary-kpi-card kpi-open">
            <span className="kpi-count">{summary.open}</span>
            <span className="kpi-label">Open Complaints</span>
          </div>
          <div className="summary-kpi-card kpi-progress">
            <span className="kpi-count">{summary.inProgress}</span>
            <span className="kpi-label">In Progress</span>
          </div>
          <div className="summary-kpi-card kpi-resolved">
            <span className="kpi-count">{summary.resolved}</span>
            <span className="kpi-label">Resolved</span>
          </div>
          <div className="summary-kpi-card kpi-urgent">
            <span className="kpi-count">{summary.urgent}</span>
            <span className="kpi-label">Urgent Issues</span>
          </div>
        </div>
      )}

      {/* Complaints Cards Grid */}
      {isLoading ? (
        <div className="loading-container py-4">
          <div className="spinner-sm"></div>
          <span className="ml-2 text-muted">Loading complaints...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon"></span>
          <p className="empty-text">No active complaints found.</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {complaints.map((comp) => (
            <ComplaintCard
              key={comp.id}
              complaint={comp}
              onClick={(c) => setSelectedComplaintId(c.id)}
              userRole={user?.role}
            />
          ))}
        </div>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaintId && (
        <ComplaintDetailsModal
          complaintId={selectedComplaintId}
          isOpen={Boolean(selectedComplaintId)}
          onClose={() => setSelectedComplaintId(null)}
          user={user}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default RecentComplaintsSection;
