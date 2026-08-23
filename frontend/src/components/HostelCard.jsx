import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HostelCard.css';

function HostelCard({ hostel }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically resolve the base path from the current URL
  const basePath = location.pathname.startsWith('/superintendent') ? '/superintendent' : '/admin';

  const handleView = () => {
    navigate(`${basePath}/hostels/${hostel.hostelId}`);
  };

  const attendancePct = hostel.attendancePercentage ?? 0;
  const occupancyPct = hostel.occupancyPercentage ?? 0;

  return (
    <div className="hostel-card">
      <h3>{hostel.name}</h3>
      <p><span>Students</span><strong>{hostel.totalStudents}</strong></p>
      <p><span>Present</span><strong>{hostel.present}</strong></p>
      <p><span>Absent</span><strong>{hostel.absent}</strong></p>
      <p><span>Not Marked</span><strong>{hostel.notMarked}</strong></p>
      <p><span>Attendance</span><strong>{attendancePct}%</strong></p>
      <p><span>Beds</span><strong>{hostel.totalBeds}</strong></p>
      <p><span>Occupied</span><strong>{hostel.occupiedBeds}</strong></p>
      <p><span>Available</span><strong>{hostel.availableBeds}</strong></p>
      <p><span>Occupancy</span><strong>{occupancyPct}%</strong></p>
      <button onClick={handleView}>View Hostel →</button>
    </div>
  );
}

export default HostelCard;
