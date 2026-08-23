import React from 'react';
import './OccupancySummary.css';

function OccupancySummary({ occupied, available, maintenance }) {
  return (
    <div className="occupancy-summary">
      <h3>Occupancy Summary</h3>
      <ul>
        <li>Occupied Beds: {occupied}</li>
        <li>Available Beds: {available}</li>
        <li>Under Maintenance: {maintenance}</li>
      </ul>
    </div>
  );
}

export default OccupancySummary;
