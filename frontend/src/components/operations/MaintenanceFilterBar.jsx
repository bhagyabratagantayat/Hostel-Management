import React from 'react';

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'FURNITURE', 'BED', 'ROOM',
  'BATHROOM', 'CLEANING', 'INTERNET', 'SAFETY', 'OTHER'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

export default function MaintenanceFilterBar({
  filters,
  onFilterChange,
  hostels = [],
  isStaff = false
}) {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      hostel_id: '',
      category: '',
      status: '',
      priority: '',
      date_from: '',
      date_to: '',
      page: 1
    });
  };

  return (
    <div className="card shadow-sm p-3 mb-4 bg-body rounded border">
      <div className="row g-2 align-items-center">
        {/* Search */}
        <div className="col-12 col-md-3">
          <label htmlFor="search-maint" className="form-label small text-muted mb-1">Search</label>
          <input
            id="search-maint"
            type="text"
            className="form-control form-control-sm"
            placeholder="Title, student, room..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Hostel Filter (Staff only) */}
        {isStaff && (
          <div className="col-6 col-md-2">
            <label htmlFor="filter-hostel" className="form-label small text-muted mb-1">Hostel</label>
            <select
              id="filter-hostel"
              className="form-select form-select-sm"
              value={filters.hostel_id || ''}
              onChange={(e) => handleChange('hostel_id', e.target.value)}
            >
              <option value="">All Hostels</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        <div className="col-6 col-md-2">
          <label htmlFor="filter-category" className="form-label small text-muted mb-1">Category</label>
          <select
            id="filter-category"
            className="form-select form-select-sm"
            value={filters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="col-6 col-md-2">
          <label htmlFor="filter-priority" className="form-label small text-muted mb-1">Priority</label>
          <select
            id="filter-priority"
            className="form-select form-select-sm"
            value={filters.priority || ''}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="col-6 col-md-2">
          <label htmlFor="filter-status" className="form-label small text-muted mb-1">Status</label>
          <select
            id="filter-status"
            className="form-select form-select-sm"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="col-12 col-md-1 text-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm w-100 mt-md-4"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
