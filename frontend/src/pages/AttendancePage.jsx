import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AttendancePage.css';

const AttendancePage = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');

  // Live Real-Time Digital Clock State
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = (d) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatClockDate = (d) => {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper date strings
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [attendanceDate, setAttendanceDate] = useState(getTodayString());
  const [attendanceList, setAttendanceList] = useState([]);
  const [markedMap, setMarkedMap] = useState({}); // studentId -> 'PRESENT' | 'ABSENT'
  const [liveTimeMap, setLiveTimeMap] = useState({}); // studentId -> HH:MM AM/PM timestamp preview

  // Session Lock & Unlock States
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isUnlockMode, setIsUnlockMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // View & Filter States
  const [viewMode, setViewMode] = useState('FLOOR'); // 'FLOOR' | 'FLAT'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNMARKED' | 'PRESENT' | 'ABSENT'

  // Student Quick Details Modal
  const [quickStudent, setQuickStudent] = useState(null);

  // Fetch available hostels
  const fetchHostels = async () => {
    try {
      const res = await api.getHostels();
      const list = res.data || (Array.isArray(res) ? res : []);
      setHostels(list);
      if (list.length > 0 && !selectedHostelId) {
        setSelectedHostelId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch hostels:', err);
      setError('Unable to load hostels list.');
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  // Fetch attendance list for selected hostel & date
  const fetchAttendance = useCallback(async () => {
    if (!selectedHostelId) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.getHostelAttendance(selectedHostelId, attendanceDate);
      const list = res.attendance || res.data || [];
      setAttendanceList(list);
      setSessionInfo(res.sessionInfo || null);
      setIsUnlockMode(false); // reset edit unlock mode on fetch

      // Initialize markedMap and liveTimeMap
      const initialMap = {};
      const initialTimeMap = {};
      list.forEach(item => {
        if (item.status) {
          initialMap[item.studentId] = item.status;
          if (item.marked_at) {
            try {
              initialTimeMap[item.studentId] = new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
              initialTimeMap[item.studentId] = '';
            }
          }
        }
      });
      setMarkedMap(initialMap);
      setLiveTimeMap(initialTimeMap);
    } catch (err) {
      console.error('Failed to load hostel attendance:', err);
      setError(err.message || 'Error loading attendance records.');
    } finally {
      setLoading(false);
    }
  }, [selectedHostelId, attendanceDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Toggle status for individual student with real-time live time preview
  const handleToggleStatus = (studentId, status) => {
    const isClearing = markedMap[studentId] === status;
    const newStatus = isClearing ? null : status;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMarkedMap(prev => ({
      ...prev,
      [studentId]: newStatus
    }));

    setLiveTimeMap(prev => ({
      ...prev,
      [studentId]: newStatus ? `${nowTimeStr} (Live)` : ''
    }));
  };

  // Mark all students present
  const handleMarkAllPresent = () => {
    const updated = { ...markedMap };
    const updatedTime = { ...liveTimeMap };
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    attendanceList.forEach(st => {
      updated[st.studentId] = 'PRESENT';
      updatedTime[st.studentId] = `${nowTimeStr} (Live)`;
    });
    setMarkedMap(updated);
    setLiveTimeMap(updatedTime);
  };

  // Mark specific floor students present
  const handleMarkFloorPresent = (floorNum) => {
    const updated = { ...markedMap };
    const updatedTime = { ...liveTimeMap };
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    attendanceList
      .filter(st => Number(st.floor_number ?? 0) === Number(floorNum))
      .forEach(st => {
        updated[st.studentId] = 'PRESENT';
        updatedTime[st.studentId] = `${nowTimeStr} (Live)`;
      });
    setMarkedMap(updated);
    setLiveTimeMap(updatedTime);
  };

  const handleClearAll = () => {
    setMarkedMap({});
    setLiveTimeMap({});
  };

  // Submit bulk attendance
  const handleSaveAttendance = async () => {
    const records = Object.entries(markedMap)
      .filter(([_, status]) => Boolean(status))
      .map(([studentId, status]) => ({
        studentId: Number(studentId),
        status
      }));

    if (records.length === 0) {
      setError('Please mark attendance for at least one student before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.bulkMarkAttendance({
        hostelId: selectedHostelId,
        date: attendanceDate,
        records
      });
      setSuccessMsg(res.message || `Successfully recorded attendance for ${records.length} student(s)!`);
      fetchAttendance();
    } catch (err) {
      setError(err.message || 'Failed to save attendance records.');
    } finally {
      setSaving(false);
    }
  };

  const downloadAttendanceRoster = () => {
    if (!attendanceList || attendanceList.length === 0) return;
    const currentHostelObj = hostels.find(h => Number(h.id) === Number(selectedHostelId));
    const exportData = attendanceList.map((st, idx) => ({
      'S.No': idx + 1,
      'Student Name': st.full_name,
      'Registration / Roll No': st.student_code || `#${st.studentId}`,
      'Branch': st.branch || 'B.Tech',
      'Year': st.year || 1,
      'Floor': `Floor ${st.floor_number ?? 0}`,
      'Room & Bed': `Room ${st.room_number || 'N/A'} - Bed ${st.bed_number || 'N/A'}`,
      'Status': markedMap[st.studentId] || 'UNMARKED',
      'Marked Time': liveTimeMap[st.studentId] || 'Pending'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily_Attendance');
    XLSX.writeFile(workbook, `${currentHostelObj?.code || 'Hostel'}_Attendance_${attendanceDate}.xlsx`);
  };

  const isLockedSession = Boolean(sessionInfo?.isLocked) && !isUnlockMode;

  // KPI Calculations
  const totalStudents = attendanceList.length;
  const presentCount = Object.values(markedMap).filter(v => v === 'PRESENT').length;
  const absentCount = Object.values(markedMap).filter(v => v === 'ABSENT').length;
  const markedCount = presentCount + absentCount;
  const unmarkedCount = Math.max(0, totalStudents - markedCount);
  const attendanceRate = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;
  const completionPercentage = totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;

  // Filtered student list
  const filteredStudents = attendanceList.filter(st => {
    const matchesSearch = (
      st.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.room_number?.toString().includes(searchTerm) ||
      st.bed_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentStatus = markedMap[st.studentId];
    if (statusFilter === 'PRESENT') return matchesSearch && currentStatus === 'PRESENT';
    if (statusFilter === 'ABSENT') return matchesSearch && currentStatus === 'ABSENT';
    if (statusFilter === 'UNMARKED') return matchesSearch && !currentStatus;
    return matchesSearch;
  });

  // Group by floors for Floor View Mode
  const floorGroups = {};
  filteredStudents.forEach(st => {
    const floorKey = st.floor_number ?? 0;
    if (!floorGroups[floorKey]) {
      floorGroups[floorKey] = [];
    }
    floorGroups[floorKey].push(st);
  });
  const sortedFloorKeys = Object.keys(floorGroups).sort((a, b) => Number(a) - Number(b));

  const currentHostelObj = hostels.find(h => Number(h.id) === Number(selectedHostelId));

  return (
    <div className="attendance-page-container">
      {/* Header Title & Real-Time Clock Section */}
      <div className="attendance-header-section">
        <div className="attendance-title-group">
          <h1>
            <i className="fa-solid fa-calendar-check text-indigo-600"></i>
            Hostel Daily Attendance Console
          </h1>
          <p>
            {user.role === 'SUPER_ADMIN' 
              ? 'Campus-wide attendance management, daily roll call, and historical records.' 
              : 'Warden roll-call console: Real-time night roll call & floor monitoring.'}
          </p>
        </div>

        {/* Real-Time Live Clock Widget */}
        <div className="realtime-clock-widget">
          <div className="clock-digits">
            {formatClockTime(now)}
          </div>
          <div className="clock-meta">
            <span className="clock-date">{formatClockDate(now)}</span>
            <span className="clock-status-live">
              <span className="pulse-dot"></span> Realtime Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* Daily Attendance Lock & Session Status Banner */}
      {sessionInfo?.isLocked && (
        <div className="attendance-lock-banner">
          <div className="lock-banner-info">
            <div className="lock-banner-icon">
              <i className={`fa-solid ${isUnlockMode ? 'fa-lock-open' : 'fa-lock'}`}></i>
            </div>
            <div>
              <h3 className="lock-banner-title">
                {isUnlockMode 
                  ? 'Modification Mode Enabled (Editing Finalized Session)' 
                  : `Roll Call Completed & Locked for ${attendanceDate}`}
              </h3>
              <p className="lock-banner-sub">
                {sessionInfo.markedBy 
                  ? `Submitted by ${sessionInfo.markedBy} ${sessionInfo.markedAt ? `at ${new Date(sessionInfo.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}` 
                  : 'Daily roll call is finalized for this date.'}
                {!isUnlockMode && ' Controls are locked to enforce 1-roll-call-per-day rule.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-unlock-session"
              onClick={() => setIsUnlockMode(prev => !prev)}
            >
              <i className={`fa-solid ${isUnlockMode ? 'fa-lock' : 'fa-pen-to-square'}`}></i>
              {isUnlockMode ? 'Lock Session' : 'Unlock to Edit'}
            </button>
            <button
              type="button"
              className="btn-bulk btn-bulk-present"
              onClick={downloadAttendanceRoster}
              style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#059669' }}
            >
              <i className="fa-solid fa-file-excel"></i> Export Excel
            </button>
          </div>
        </div>
      )}

      {/* Alert Notices */}
      {error && (
        <div className="alert alert-error mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffe4e6', color: '#be123c', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fecdd3' }}>
          <i className="fa-solid fa-circle-exclamation text-lg"></i>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#be123c', fontWeight: 700 }}>×</button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <i className="fa-solid fa-circle-check text-lg"></i>
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Control Bar: Hostel & Date Selection */}
      <div className="attendance-controls-card">
        <div className="controls-flex-row">
          <div className="control-item-group">
            <span className="control-label">Hostel Residence:</span>
            <select 
              className="modern-select"
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              style={{ minWidth: '240px' }}
            >
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
              ))}
            </select>
          </div>

          <div className="control-item-group">
            <span className="control-label">Roll Call Date:</span>
            <input 
              type="date"
              className="modern-date-input"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />

            <button 
              type="button" 
              className={`quick-date-btn ${attendanceDate === getTodayString() ? 'active' : ''}`}
              onClick={() => setAttendanceDate(getTodayString())}
            >
              <i className="fa-solid fa-clock"></i> Today
            </button>
            <button 
              type="button" 
              className={`quick-date-btn ${attendanceDate === getYesterdayString() ? 'active' : ''}`}
              onClick={() => setAttendanceDate(getYesterdayString())}
            >
              <i className="fa-solid fa-rotate-left"></i> Yesterday
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="attendance-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="kpi-details">
            <div className="kpi-val">{totalStudents}</div>
            <div className="kpi-label">Total Enrolled</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="kpi-details">
            <div className="kpi-val" style={{ color: '#15803d' }}>{presentCount}</div>
            <div className="kpi-label">Present</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-rose">
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
          <div className="kpi-details">
            <div className="kpi-val" style={{ color: '#be123c' }}>{absentCount}</div>
            <div className="kpi-label">Absent</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-slate">
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
          <div className="kpi-details">
            <div className="kpi-val" style={{ color: '#475569' }}>{unmarkedCount}</div>
            <div className="kpi-label">Unmarked</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-amber">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div className="kpi-details">
            <div className="kpi-val" style={{ color: attendanceRate >= 85 ? '#15803d' : attendanceRate >= 75 ? '#b45309' : '#be123c' }}>
              {attendanceRate}%
            </div>
            <div className="kpi-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Roster Progress Bar */}
      <div className="roster-progress-container">
        <div className="progress-info-row">
          <span>
            <i className="fa-solid fa-list-check text-indigo-500 mr-2"></i>
            Roll Call Progress ({markedCount} / {totalStudents} Marked)
          </span>
          <span style={{ color: completionPercentage === 100 ? '#10b981' : '#4f46e5' }}>
            {completionPercentage}% Complete
          </span>
        </div>
        <div className="progress-track-bg">
          <div className="progress-fill-bar" style={{ width: `${completionPercentage}%` }}></div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="bulk-actions-card">
        <div className="bulk-actions-info">
          <div className="bulk-icon">
            <i className="fa-solid fa-sliders"></i>
          </div>
          <div>
            <h3>Roll Call Action Center</h3>
            <p>Mark all active students present or edit individual statuses before saving.</p>
          </div>
        </div>

        <div className="bulk-btns-wrapper">
          <button 
            type="button" 
            className="btn-bulk btn-bulk-present"
            onClick={handleMarkAllPresent}
            disabled={isLockedSession}
          >
            <i className="fa-solid fa-check-double"></i> Mark All Present
          </button>
          <button 
            type="button" 
            className="btn-bulk btn-bulk-reset"
            onClick={handleClearAll}
            disabled={isLockedSession}
          >
            <i className="fa-solid fa-rotate-left"></i> Reset
          </button>
          <button 
            type="button" 
            className="btn-bulk btn-bulk-save"
            onClick={handleSaveAttendance}
            disabled={saving || isLockedSession}
          >
            <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
            {saving ? 'Saving...' : `Save Attendance (${markedCount})`}
          </button>
        </div>
      </div>

      {/* Filters & View Mode Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: '1' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          <input 
            type="text"
            className="modern-select"
            placeholder="Search by student name, Reg No, room or bed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div className="status-toggle-group">
            <button
              type="button"
              className={`btn-toggle-status ${viewMode === 'FLOOR' ? 'active-present' : ''}`}
              onClick={() => setViewMode('FLOOR')}
            >
              <i className="fa-solid fa-layer-group"></i> Group by Floor
            </button>
            <button
              type="button"
              className={`btn-toggle-status ${viewMode === 'FLAT' ? 'active-present' : ''}`}
              onClick={() => setViewMode('FLAT')}
            >
              <i className="fa-solid fa-list-ul"></i> Flat List
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'UNMARKED', 'PRESENT', 'ABSENT'].map(st => (
              <button
                key={st}
                type="button"
                className={`quick-date-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roll Call Content View */}
      {loading ? (
        <div className="roll-call-table-wrapper" style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
          <i className="fa-solid fa-circle-notch fa-spin text-indigo-600" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
          <p style={{ fontWeight: 600 }}>Syncing attendance roster...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="roll-call-table-wrapper" style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
          <i className="fa-solid fa-user-slash text-slate-300" style={{ fontSize: '3rem', marginBottom: '12px', display: 'block' }}></i>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>No Students Found</h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            {searchTerm ? 'No students match your search criteria.' : 'No active student room allocations found for this hostel.'}
          </p>
        </div>
      ) : viewMode === 'FLOOR' ? (
        /* Floor-by-Floor Grouped Accordion View */
        <div>
          {sortedFloorKeys.map(floorNum => {
            const floorStudents = floorGroups[floorNum];
            const floorPresent = floorStudents.filter(s => markedMap[s.studentId] === 'PRESENT').length;

            return (
              <div key={floorNum} className="floor-card-group">
                <div className="floor-accordion-header">
                  <div className="floor-accordion-title">
                    <i className="fa-solid fa-building-user text-indigo-600"></i>
                    <span>Floor {floorNum}</span>
                    <span className="floor-badge">
                      {floorStudents.length} Student(s) • {floorPresent} Present
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-floor-mark-all"
                    onClick={() => handleMarkFloorPresent(floorNum)}
                    disabled={isLockedSession}
                  >
                    <i className="fa-solid fa-check"></i> Mark Floor {floorNum} Present
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="roll-call-table">
                    <thead>
                      <tr>
                        <th>Student Info</th>
                        <th>Reg / Roll No</th>
                        <th>Room & Bed</th>
                        <th>Status Toggle</th>
                        <th>Marked Time / Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorStudents.map(st => {
                        const currentStatus = markedMap[st.studentId];
                        const initials = st.full_name ? st.full_name.substring(0, 2).toUpperCase() : 'ST';
                        const liveTime = liveTimeMap[st.studentId];

                        return (
                          <tr key={st.studentId}>
                            <td>
                              <div className="student-info-cell" onClick={() => setQuickStudent(st)}>
                                <div className="student-avatar-mini">
                                  {st.photo_url ? (
                                    <img src={st.photo_url} alt={st.full_name} />
                                  ) : (
                                    initials
                                  )}
                                </div>
                                <div className="student-name-meta">
                                  <span className="name">
                                    {st.full_name} <i className="fa-solid fa-circle-info text-slate-300 text-xs"></i>
                                  </span>
                                  <span className="sub">{st.branch || 'B.Tech'} • Year {st.year || 1}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span style={{ fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>
                                {st.student_code || `#${st.studentId}`}
                              </span>
                            </td>

                            <td>
                              <span className="room-bed-badge">
                                <i className="fa-solid fa-bed text-indigo-500"></i>
                                Room {st.room_number || 'N/A'} - Bed {st.bed_number || 'N/A'}
                              </span>
                            </td>

                            <td>
                              <div className="status-toggle-group">
                                <button
                                  type="button"
                                  className={`btn-toggle-status ${currentStatus === 'PRESENT' ? 'active-present' : ''}`}
                                  onClick={() => handleToggleStatus(st.studentId, 'PRESENT')}
                                  disabled={isLockedSession}
                                >
                                  <i className="fa-solid fa-circle-check"></i> Present
                                </button>
                                <button
                                  type="button"
                                  className={`btn-toggle-status ${currentStatus === 'ABSENT' ? 'active-absent' : ''}`}
                                  onClick={() => handleToggleStatus(st.studentId, 'ABSENT')}
                                  disabled={isLockedSession}
                                >
                                  <i className="fa-solid fa-circle-xmark"></i> Absent
                                </button>
                              </div>
                            </td>

                            <td>
                              {liveTime ? (
                                <span className="live-preview-pill">
                                  <i className="fa-solid fa-clock"></i> {liveTime}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat List Table View */
        <div className="roll-call-table-wrapper">
          <div style={{ overflowX: 'auto' }}>
            <table className="roll-call-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Reg / Roll No</th>
                  <th>Room & Bed</th>
                  <th>Floor</th>
                  <th>Status Toggle</th>
                  <th>Marked Time / Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(st => {
                  const currentStatus = markedMap[st.studentId];
                  const initials = st.full_name ? st.full_name.substring(0, 2).toUpperCase() : 'ST';
                  const liveTime = liveTimeMap[st.studentId];

                  return (
                    <tr key={st.studentId}>
                      <td>
                        <div className="student-info-cell" onClick={() => setQuickStudent(st)}>
                          <div className="student-avatar-mini">
                            {st.photo_url ? (
                              <img src={st.photo_url} alt={st.full_name} />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="student-name-meta">
                            <span className="name">
                              {st.full_name} <i className="fa-solid fa-circle-info text-slate-300 text-xs"></i>
                            </span>
                            <span className="sub">{st.branch || 'B.Tech'} • Year {st.year || 1}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>
                          {st.student_code || `#${st.studentId}`}
                        </span>
                      </td>

                      <td>
                        <span className="room-bed-badge">
                          <i className="fa-solid fa-bed text-indigo-500"></i>
                          Room {st.room_number || 'N/A'} - Bed {st.bed_number || 'N/A'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                          Floor {st.floor_number ?? '0'}
                        </span>
                      </td>

                      <td>
                        <div className="status-toggle-group">
                          <button
                            type="button"
                            className={`btn-toggle-status ${currentStatus === 'PRESENT' ? 'active-present' : ''}`}
                            onClick={() => handleToggleStatus(st.studentId, 'PRESENT')}
                            disabled={isLockedSession}
                          >
                            <i className="fa-solid fa-circle-check"></i> Present
                          </button>
                          <button
                            type="button"
                            className={`btn-toggle-status ${currentStatus === 'ABSENT' ? 'active-absent' : ''}`}
                            onClick={() => handleToggleStatus(st.studentId, 'ABSENT')}
                            disabled={isLockedSession}
                          >
                            <i className="fa-solid fa-circle-xmark"></i> Absent
                          </button>
                        </div>
                      </td>

                      <td>
                        {liveTime ? (
                          <span className="live-preview-pill">
                            <i className="fa-solid fa-clock"></i> {liveTime}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Quick Contact & Info Modal Overlay */}
      {quickStudent && (
        <div className="student-quick-modal-overlay" onClick={() => setQuickStudent(null)}>
          <div className="student-quick-modal-card" onClick={e => e.stopPropagation()}>
            <div className="quick-modal-header">
              <div className="quick-avatar">
                {quickStudent.photo_url ? (
                  <img src={quickStudent.photo_url} alt={quickStudent.full_name} />
                ) : (
                  quickStudent.full_name ? quickStudent.full_name.substring(0, 2).toUpperCase() : 'ST'
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {quickStudent.full_name}
                </h2>
                <span className="room-bed-badge">
                  Room {quickStudent.room_number || 'N/A'} - Bed {quickStudent.bed_number || 'N/A'}
                </span>
              </div>
            </div>

            <div className="quick-modal-body">
              <div className="info-row">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Registration / Roll No:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{quickStudent.student_code || `#${quickStudent.studentId}`}</span>
              </div>
              <div className="info-row">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Course & Branch:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{quickStudent.course || 'B.Tech'} - {quickStudent.branch || 'General'}</span>
              </div>
              <div className="info-row">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Floor Location:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Floor {quickStudent.floor_number ?? '0'}</span>
              </div>
              <div className="info-row">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Contact Number:</span>
                <span style={{ fontWeight: 700, color: '#4f46e5' }}>{quickStudent.phone || 'Not Provided'}</span>
              </div>
              <div className="info-row">
                <span style={{ color: '#64748b', fontWeight: 600 }}>Hostel Residence:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{currentHostelObj?.name || 'Main Hostel'}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              {quickStudent.phone && (
                <a 
                  href={`tel:${quickStudent.phone}`} 
                  className="btn-bulk btn-bulk-present" 
                  style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                >
                  <i className="fa-solid fa-phone"></i> Call Student
                </a>
              )}
              <button 
                type="button" 
                className="btn-bulk btn-bulk-reset" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setQuickStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
