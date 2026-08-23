import React from 'react';
import './AttendanceChart.css';

function AttendanceChart({ present, absent, notMarked }) {
  return (
    <div className="attendance-chart">
      <h3>Attendance Summary</h3>
      <ul>
        <li>Present: {present}</li>
        <li>Absent: {absent}</li>
        <li>Not Marked: {notMarked}</li>
      </ul>
    </div>
  );
}

export default AttendanceChart;
