import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const MasterFloorsPage = () => {
  const [floors, setFloors] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [formData, setFormData] = useState({
    hostel_id: '',
    floor_name: '',
    floor_number: 1,
    status: 'ACTIVE'
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    fetchFloors();
  }, [page, selectedHostelId, searchTerm]);

  const loadHostels = async () => {
    try {
      const res = await api.getHostels({ limit: 100 });
      if (res.success) {
        setHostels(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load hostels list:', err);
    }
  };

  const fetchFloors = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10, search: searchTerm };
      if (selectedHostelId) params.hostel_id = selectedHostelId;

      const res = await api.getFloors(params);
      if (res.success) {
        setFloors(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || 'Failed to fetch floors.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching floors.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingFloor(null);
    setFormData({
      hostel_id: selectedHostelId || (hostels[0]?.id || ''),
      floor_name: '',
      floor_number: 1,
      status: 'ACTIVE'
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (floor) => {
    setEditingFloor(floor);
    setFormData({
      hostel_id: floor.hostel_id || '',
      floor_name: floor.floor_name || '',
      floor_number: floor.floor_number ?? 1,
      status: floor.status || 'ACTIVE'
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingFloor) {
        const res = await api.updateFloor(editingFloor.id, formData);
        if (res.success) {
          setShowModal(false);
          fetchFloors();
        } else {
          setModalError(res.message || 'Failed to update floor.');
        }
      } else {
        const res = await api.createFloor(formData);
        if (res.success) {
          setShowModal(false);
          fetchFloors();
        } else {
          setModalError(res.message || 'Failed to create floor.');
        }
      }
    } catch (err) {
      setModalError(err.message || 'An error occurred while saving floor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete floor "${name}"?`)) return;

    try {
      const res = await api.deleteFloor(id);
      if (res.success) {
        fetchFloors();
      } else {
        alert(res.message || 'Failed to delete floor.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting floor.');
    }
  };

  return (
    <div className="master-floors-page">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="breadcrumbs text-sm text-gray-500 mb-1">
            <Link to="/admin/master" className="hover:underline">Master Data</Link> / <span>Floors</span>
          </div>
          <h1 className="page-heading">📑 Floor Management</h1>
          <p className="page-subheading">Manage hostel floor levels, floor numbers, and floor names.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-indigo flex items-center gap-2">
          <span>➕</span> Add New Floor
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="search-bar-container bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Hostel Filter Dropdown */}
          <select
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-64"
            value={selectedHostelId}
            onChange={(e) => {
              setSelectedHostelId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Hostels</option>
            {hostels.map(h => (
              <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="form-input w-full pl-9 pr-4 py-2 border rounded-md text-sm"
              placeholder="Search floor name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Total Floors: <span className="font-semibold text-gray-800">{pagination.total}</span>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      {/* Floors Table / Cards */}
      {loading ? (
        <Loading message="Loading floors list..." />
      ) : floors.length === 0 ? (
        <div className="empty-state bg-white p-8 rounded-lg text-center border">
          <span className="text-4xl">📑</span>
          <h3 className="font-bold text-gray-700 mt-2">No Floors Found</h3>
          <p className="text-sm text-gray-500 mt-1">Select another hostel filter or create a new floor.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Floor Name</th>
                  <th className="p-4">Floor Number</th>
                  <th className="p-4">Hostel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {floors.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{f.floor_name}</td>
                    <td className="p-4 text-gray-600"><span className="badge badge-gray">Level {f.floor_number}</span></td>
                    <td className="p-4 text-gray-600">{f.hostel_name || 'Hostel'}</td>
                    <td className="p-4">
                      <span className={`badge ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(f)} className="btn btn-sm btn-outline">Edit</button>
                      <button onClick={() => handleDeleteFloor(f.id, f.floor_name)} className="btn btn-sm btn-danger-outline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden grid-cols-1 gap-4 mb-6">
            {floors.map((f) => (
              <div key={f.id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{f.floor_name}</h3>
                    <span className="badge badge-gray mt-1">Level {f.floor_number}</span>
                  </div>
                  <span className={`badge ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {f.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <div><strong>Hostel:</strong> {f.hostel_name || 'Hostel'}</div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => handleOpenEditModal(f)} className="btn btn-sm btn-outline">Edit</button>
                  <button onClick={() => handleDeleteFloor(f.id, f.floor_name)} className="btn btn-sm btn-danger-outline">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination flex justify-center items-center gap-2 mb-6">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-sm btn-outline">Previous</button>
              <span className="text-xs text-gray-600">Page {page} of {pagination.totalPages}</span>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm btn-outline">Next</button>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingFloor ? 'Edit Floor' : 'Create New Floor'}
            </h2>

            {modalError && (
              <div className="alert alert-error text-xs mb-4">
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Select Hostel *</label>
                <select
                  className="form-select w-full"
                  required
                  value={formData.hostel_id}
                  onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                >
                  <option value="">-- Choose Hostel --</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Floor Name *</label>
                <input
                  type="text"
                  className="form-input w-full"
                  required
                  value={formData.floor_name}
                  onChange={(e) => setFormData({ ...formData, floor_name: e.target.value })}
                  placeholder="e.g. First Floor / Wing A Ground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Floor Number *</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    required
                    value={formData.floor_number}
                    onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-indigo">
                  {submitting ? 'Saving...' : (editingFloor ? 'Save Changes' : 'Create Floor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterFloorsPage;
