import React from 'react';

const MODULES = [
  { label: 'All Modules', value: '' },
  { label: 'Authentication', value: 'AUTHENTICATION' },
  { label: 'Users', value: 'USERS' },
  { label: 'Students', value: 'STUDENTS' },
  { label: 'Hostels & Rooms', value: 'HOSTELS' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'Notices', value: 'NOTICES' },
  { label: 'Complaints', value: 'COMPLAINTS' },
  { label: 'Visitors', value: 'VISITORS' },
  { label: 'Mess & Food', value: 'MESS' },
  { label: 'Fees & Payments', value: 'FEES' },
  { label: 'Room Allocation', value: 'ALLOCATION' }
];

export const ActivityFilterBar = ({ filters, onFilterChange, onReset, hostels = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value, page: 1 });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-4 mb-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Search Description</label>
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleChange}
            placeholder="Search activities..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Module Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Module</label>
          <select
            name="module"
            value={filters.module || ''}
            onChange={handleChange}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hostel Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Hostel</label>
          <select
            name="hostelId"
            value={filters.hostelId || ''}
            onChange={handleChange}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleChange}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleChange}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-all"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
