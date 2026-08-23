import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportFilterBar from '../components/reports/ReportFilterBar';
import ReportStatCard from '../components/reports/ReportStatCard';
import ReportChart from '../components/reports/ReportChart';
import './ReportsPage.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'attendance', label: 'Attendance', icon: '📝' },
  { id: 'occupancy', label: 'Occupancy', icon: '🛏️' },
  { id: 'complaints', label: 'Complaints', icon: '🛠️' },
  { id: 'visitors', label: 'Visitors', icon: '👥' },
  { id: 'mess', label: 'Mess & Food', icon: '🍲' },
  { id: 'fees', label: 'Fees & Dues', icon: '💳' },
];

const ReportsPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('overview');
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize date range (last 30 days)
  const today = new Date();
  const past30Days = new Date();
  past30Days.setDate(today.getDate() - 30);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    hostel_id: 'all',
    date_from: formatDate(past30Days),
    date_to: formatDate(today)
  });

  // Report Data States
  const [overviewData, setOverviewData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [complaintData, setComplaintData] = useState(null);
  const [visitorData, setVisitorData] = useState(null);
  const [messData, setMessData] = useState(null);
  const [feeData, setFeeData] = useState(null);

  // Fetch Hostels for Filter dropdown
  useEffect(() => {
    api.getHostels()
      .then(res => {
        if (res.success) {
          setHostels(res.data || []);
        }
      })
      .catch(err => console.error('Failed to load hostels for report filter:', err));
  }, []);

  // Fetch report data for active tab
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = { ...filters };

    try {
      if (activeTab === 'overview') {
        const res = await api.getOverviewReport(queryParams);
        if (res.success) setOverviewData(res.data);
      } else if (activeTab === 'students') {
        const res = await api.getStudentReport(queryParams);
        if (res.success) setStudentData(res.data);
      } else if (activeTab === 'attendance') {
        const res = await api.getAttendanceReport(queryParams);
        if (res.success) setAttendanceData(res.data);
      } else if (activeTab === 'occupancy') {
        const res = await api.getOccupancyReport(queryParams);
        if (res.success) setOccupancyData(res.data);
      } else if (activeTab === 'complaints') {
        const res = await api.getComplaintReport(queryParams);
        if (res.success) setComplaintData(res.data);
      } else if (activeTab === 'visitors') {
        const res = await api.getVisitorReport(queryParams);
        if (res.success) setVisitorData(res.data);
      } else if (activeTab === 'mess') {
        const res = await api.getMessReport(queryParams);
        if (res.success) setMessData(res.data);
      } else if (activeTab === 'fees') {
        const res = await api.getFeeReport(queryParams);
        if (res.success) setFeeData(res.data);
      }
    } catch (err) {
      console.error(`Error loading ${activeTab} report:`, err);
      setError(err.response?.data?.message || `Unable to load ${activeTab} report.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  };

  return (
    <div className="reports-page-container">
      {/* Page Header */}
      <div className="reports-page-header">
        <div>
          <h1 className="reports-page-title">📈 Reports & Analytics Center</h1>
          <p className="reports-page-subtitle">
            Comprehensive hostel performance, financial overview, and operational analytics.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        filters={filters}
        onFilterChange={setFilters}
        hostels={hostels}
        isSuperAdmin={isSuperAdmin}
        onRefresh={fetchReportData}
        loading={loading}
      />

      {/* Navigation Tabs */}
      <div className="reports-tabs-wrapper">
        <div className="reports-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`reports-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Localized Error Display */}
      {error && (
        <div className="report-error-alert card">
          <div className="error-alert-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchReportData}>
            Retry
          </button>
        </div>
      )}

      {/* REPORT CONTENT AREA */}
      <div className="reports-content-body">

        {/* 1. OVERVIEW REPORT */}
        {activeTab === 'overview' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Hostels"
                value={overviewData?.infrastructure?.totalHostels ?? '-'}
                subtitle="Active facilities"
                icon="🏢"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Total Students"
                value={overviewData?.infrastructure?.totalStudents ?? '-'}
                subtitle="Active registrations"
                icon="🎓"
                color="info"
                loading={loading}
              />
              <ReportStatCard
                title="Beds Occupancy"
                value={`${overviewData?.infrastructure?.occupancyPercentage ?? 0}%`}
                subtitle={`${overviewData?.infrastructure?.occupiedBeds || 0} / ${overviewData?.infrastructure?.usableBeds || (overviewData?.infrastructure?.occupiedBeds + overviewData?.infrastructure?.availableBeds) || 0} usable beds`}
                icon="🛏️"
                color="success"
                loading={loading}
              />
              <ReportStatCard
                title="Today's Attendance"
                value={`${overviewData?.attendance?.attendancePercentage ?? 0}%`}
                subtitle={`${overviewData?.attendance?.presentToday || 0} Present, ${overviewData?.attendance?.absentToday || 0} Absent`}
                icon="📝"
                color="warning"
                loading={loading}
              />
              <ReportStatCard
                title="Open Complaints"
                value={overviewData?.complaints?.openComplaints ?? '-'}
                subtitle={`${overviewData?.complaints?.urgentComplaints || 0} urgent unresolved`}
                icon="🛠️"
                color="danger"
                loading={loading}
              />
              <ReportStatCard
                title="Fee Collection Rate"
                value={`${overviewData?.fees?.collectionRate ?? 0}%`}
                subtitle={`Collected: ${formatCurrency(overviewData?.fees?.totalCollected || 0)}`}
                icon="💳"
                color="purple"
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* 2. STUDENTS REPORT */}
        {activeTab === 'students' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Students"
                value={studentData?.totalStudents ?? '-'}
                subtitle="Enrolled active students"
                icon="🎓"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Branches Tracked"
                value={studentData?.byBranch?.length ?? '-'}
                subtitle="Academic departments"
                icon="📚"
                color="info"
                loading={loading}
              />
            </div>

            <div className="report-grid-two">
              <div className="card report-table-card">
                <h4 className="card-title">Distribution by Branch</h4>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Student Count</th>
                        <th>Share %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData?.byBranch?.map((b, i) => (
                        <tr key={i}>
                          <td><strong>{b.branch}</strong></td>
                          <td>{b.count}</td>
                          <td>{studentData.totalStudents > 0 ? ((b.count / studentData.totalStudents) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card report-table-card">
                <h4 className="card-title">Distribution by Hostel</h4>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Hostel</th>
                        <th>Student Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData?.byHostel?.map((h, i) => (
                        <tr key={i}>
                          <td><strong>{h.hostel_name}</strong></td>
                          <td>{h.student_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ATTENDANCE REPORT */}
        {activeTab === 'attendance' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Present Today"
                value={attendanceData?.summary?.present ?? '-'}
                subtitle={`${attendanceData?.summary?.attendancePercentage ?? 0}% Present Rate`}
                icon="✅"
                color="success"
                loading={loading}
              />
              <ReportStatCard
                title="Absent Today"
                value={attendanceData?.summary?.absent ?? '-'}
                subtitle="Marked absent"
                icon="❌"
                color="danger"
                loading={loading}
              />
              <ReportStatCard
                title="Not Marked Today"
                value={attendanceData?.summary?.notMarked ?? '-'}
                subtitle="Pending roll call"
                icon="⏳"
                color="warning"
                loading={loading}
              />
            </div>

            <ReportChart
              title="Daily Attendance Trend"
              data={attendanceData?.dailyTrend || []}
              xKey="date"
              yKey="present"
              label="Present Students"
              color="#10B981"
            />

            <div className="card report-table-card">
              <h4 className="card-title">Hostel Attendance Comparison</h4>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Hostel Name</th>
                      <th>Total Students</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Not Marked</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData?.hostelComparison?.map(h => (
                      <tr key={h.hostel_id}>
                        <td><strong>{h.hostel_name}</strong></td>
                        <td>{h.totalStudents}</td>
                        <td className="text-success">{h.present}</td>
                        <td className="text-danger">{h.absent}</td>
                        <td className="text-muted">{h.notMarked}</td>
                        <td><strong>{h.attendancePercentage}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. OCCUPANCY REPORT */}
        {activeTab === 'occupancy' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Capacity"
                value={occupancyData?.overall?.totalBeds ?? '-'}
                subtitle="Total registered beds"
                icon="🛏️"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Occupied Beds"
                value={occupancyData?.overall?.occupied ?? '-'}
                subtitle={`${occupancyData?.overall?.occupancyPercentage ?? 0}% Occupancy Rate`}
                icon="👤"
                color="success"
                loading={loading}
              />
              <ReportStatCard
                title="Available Beds"
                value={occupancyData?.overall?.available ?? '-'}
                subtitle="Ready for allocation"
                icon="🟢"
                color="info"
                loading={loading}
              />
              <ReportStatCard
                title="Maintenance Beds"
                value={occupancyData?.overall?.maintenance ?? '-'}
                subtitle="Excluded from usable percentage"
                icon="🛠️"
                color="warning"
                loading={loading}
              />
            </div>

            <div className="card report-table-card">
              <h4 className="card-title">Hostel-wise Occupancy Breakdown</h4>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Hostel</th>
                      <th>Total Beds</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Maintenance</th>
                      <th>Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancyData?.byHostel?.map(h => (
                      <tr key={h.hostel_id}>
                        <td><strong>{h.hostel_name}</strong></td>
                        <td>{h.totalBeds}</td>
                        <td className="text-success">{h.occupied}</td>
                        <td className="text-info">{h.available}</td>
                        <td className="text-warning">{h.maintenance}</td>
                        <td><strong>{h.occupancyPercentage}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. COMPLAINTS REPORT */}
        {activeTab === 'complaints' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Complaints"
                value={complaintData?.summary?.totalComplaints ?? '-'}
                subtitle={`Resolution Rate: ${complaintData?.summary?.resolutionRate ?? 0}%`}
                icon="🛠️"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Open & In Progress"
                value={(complaintData?.summary?.open || 0) + (complaintData?.summary?.inProgress || 0)}
                subtitle={`${complaintData?.summary?.urgent || 0} urgent items`}
                icon="⏳"
                color="warning"
                loading={loading}
              />
              <ReportStatCard
                title="Resolved / Closed"
                value={(complaintData?.summary?.resolved || 0) + (complaintData?.summary?.closed || 0)}
                subtitle="Successfully completed"
                icon="✅"
                color="success"
                loading={loading}
              />
            </div>

            <ReportChart
              title="Daily Complaint Inflow Trend"
              data={complaintData?.trend || []}
              xKey="date"
              yKey="count"
              label="Complaints"
              color="#F59E0B"
            />

            <div className="report-grid-two">
              <div className="card report-table-card">
                <h4 className="card-title">Complaints by Category</h4>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaintData?.byCategory?.map((c, i) => (
                        <tr key={i}>
                          <td><strong>{c.category}</strong></td>
                          <td>{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card report-table-card">
                <h4 className="card-title">Complaints by Priority</h4>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaintData?.byPriority?.map((p, i) => (
                        <tr key={i}>
                          <td><strong>{p.priority}</strong></td>
                          <td>{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. VISITORS REPORT */}
        {activeTab === 'visitors' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Visits"
                value={visitorData?.summary?.totalVisits ?? '-'}
                subtitle="Total registered visits"
                icon="👥"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Currently Checked In"
                value={visitorData?.summary?.currentVisitors ?? '-'}
                subtitle={`${visitorData?.summary?.overdueVisitors || 0} overdue inside`}
                icon="🚪"
                color="info"
                loading={loading}
              />
              <ReportStatCard
                title="Checked Out"
                value={visitorData?.summary?.checkedOut ?? '-'}
                subtitle="Completed visits"
                icon="✅"
                color="success"
                loading={loading}
              />
            </div>

            <ReportChart
              title="Daily Visitor Trend"
              data={visitorData?.trend || []}
              xKey="date"
              yKey="count"
              label="Visitors"
              color="#3B82F6"
            />
          </div>
        )}

        {/* 7. MESS REPORT */}
        {activeTab === 'mess' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Overall Participation"
                value={`${messData?.summary?.overallParticipationPercentage ?? 0}%`}
                subtitle={`${messData?.summary?.overallTaking || 0} / ${messData?.summary?.overallTotal || 0} meals opted`}
                icon="🍲"
                color="success"
                loading={loading}
              />
            </div>

            <div className="card report-table-card">
              <h4 className="card-title">Meal Participation by Meal Type</h4>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th>Taking</th>
                      <th>Not Taking</th>
                      <th>Total Responses</th>
                      <th>Participation %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messData?.byMealType?.map(m => (
                      <tr key={m.meal_type}>
                        <td><strong>{m.meal_type}</strong></td>
                        <td className="text-success">{m.taking}</td>
                        <td className="text-muted">{m.notTaking}</td>
                        <td>{m.totalResponses}</td>
                        <td><strong>{m.participationPercentage}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. FEES REPORT */}
        {activeTab === 'fees' && (
          <div className="report-section">
            <div className="report-stats-grid">
              <ReportStatCard
                title="Total Expected"
                value={formatCurrency(feeData?.summary?.totalExpected || 0)}
                subtitle="Gross assigned fees"
                icon="💳"
                color="primary"
                loading={loading}
              />
              <ReportStatCard
                title="Total Collected"
                value={formatCurrency(feeData?.summary?.totalCollected || 0)}
                subtitle={`Collection Rate: ${feeData?.summary?.collectionRate ?? 0}%`}
                icon="💰"
                color="success"
                loading={loading}
              />
              <ReportStatCard
                title="Pending Dues"
                value={formatCurrency(feeData?.summary?.totalPending || 0)}
                subtitle="Outstanding balances"
                icon="⏳"
                color="warning"
                loading={loading}
              />
              <ReportStatCard
                title="Overdue Balance"
                value={formatCurrency(feeData?.summary?.totalOverdue || 0)}
                subtitle="Past due date"
                icon="🚨"
                color="danger"
                loading={loading}
              />
            </div>

            <ReportChart
              title="Daily Fee Collection Trend"
              data={feeData?.dailyCollectionTrend || []}
              xKey="date"
              yKey="totalCollected"
              label="Collection Amount"
              color="#8B5CF6"
              isCurrency={true}
            />

            <div className="card report-table-card">
              <h4 className="card-title">Fee Collection by Fee Type</h4>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Fee Category</th>
                      <th>Expected Amount</th>
                      <th>Collected Amount</th>
                      <th>Collection %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData?.byFeeType?.map(f => (
                      <tr key={f.fee_type}>
                        <td><strong>{f.fee_type}</strong></td>
                        <td>{formatCurrency(f.expected)}</td>
                        <td className="text-success">{formatCurrency(f.collected)}</td>
                        <td><strong>{f.collectionRate}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsPage;
