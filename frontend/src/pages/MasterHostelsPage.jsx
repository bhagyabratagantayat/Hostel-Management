import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const MasterHostelsPage = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'BOYS',
    capacity: 100,
    address: '',
    status: 'ACTIVE'
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHostels();
  }, [page, searchTerm]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHostels({ search: searchTerm, page, limit: 10 });
      if (res.success) {
        setHostels(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || 'Failed to fetch hostels.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching hostels.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingHostel(null);
    setFormData({
      name: '',
      code: '',
      type: 'BOYS',
      capacity: 100,
      address: '',
      status: 'ACTIVE'
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (hostel) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name || '',
      code: hostel.code || '',
      type: hostel.gender === 'FEMALE' ? 'GIRLS' : (hostel.gender === 'COED' ? 'COED' : 'BOYS'),
      capacity: hostel.capacity || 100,
      address: hostel.address || '',
      status: hostel.status || 'ACTIVE'
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingHostel) {
        const res = await api.updateHostel(editingHostel.id, formData);
        if (res.success) {
          setShowModal(false);
          fetchHostels();
        } else {
          setModalError(res.message || 'Failed to update hostel.');
        }
      } else {
        const res = await api.createHostel(formData);
        if (res.success) {
          setShowModal(false);
          fetchHostels();
        } else {
          setModalError(res.message || 'Failed to create hostel.');
        }
      }
    } catch (err) {
      setModalError(err.message || 'An error occurred while saving hostel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHostel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete hostel "${name}"? This action requires no active allocations or dependencies.`)) {
      return;
    }

    try {
      const res = await api.deleteHostel(id);
      if (res.success) {
        fetchHostels();
      } else {
        alert(res.message || 'Failed to delete hostel.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting hostel.');
    }
  };

  return (
    <div className="master-hostels-page">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="breadcrumbs text-sm text-gray-500 mb-1">
            <Link to="/admin/master" className="hover:underline">Master Data</Link> / <span>Hostels</span>
          </div>
          <h1 className="page-heading">🏢 Hostels Administration</h1>
          <p className="page-subheading">Manage core hostel entities, codes, types, and capacity limits.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-indigo flex items-center gap-2">
          <span>➕</span> Add New Hostel
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className="form-input w-full pl-10 pr-4 py-2 border rounded-md"
            placeholder="Search hostel name or code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <div className="text-sm text-gray-500">
          Total Hostels: <span className="font-semibold text-gray-800">{pagination.total}</span>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      {/* Loading state */}
      {loading ? (
        <Loading message="Loading hostels list..." />
      ) : hostels.length === 0 ? (
        <div className="empty-state bg-white p-8 rounded-lg text-center border">
          <span className="text-4xl">🏢</span>
          <h3 className="font-bold text-gray-700 mt-2">No Hostels Found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search filter or add a new hostel.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Hostel Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {hostels.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{h.name}</td>
                    <td className="p-4 text-gray-600"><span className="badge badge-gray">{h.code}</span></td>
                    <td className="p-4 text-gray-600">{h.gender || h.type || 'BOYS'}</td>
                    <td className="p-4 text-gray-600">{h.capacity} beds</td>
                    <td className="p-4">
                      <span className={`badge ${h.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(h)} className="btn btn-sm btn-outline">Edit</button>
                      <button onClick={() => handleDeleteHostel(h.id, h.name)} className="btn btn-sm btn-danger-outline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden grid-cols-1 gap-4 mb-6">
            {hostels.map((h) => (
              <div key={h.id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{h.name}</h3>
                    <span className="badge badge-gray mt-1">{h.code}</span>
                  </div>
                  <span className={`badge ${h.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {h.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Type:</strong> {h.gender || h.type || 'BOYS'}</div>
                  <div><strong>Capacity:</strong> {h.capacity} beds</div>
                  {h.address && <div><strong>Address:</strong> {h.address}</div>}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => handleOpenEditModal(h)} className="btn btn-sm btn-outline">Edit</button>
                  <button onClick={() => handleDeleteHostel(h.id, h.name)} className="btn btn-sm btn-danger-outline">Delete</button>
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
              {editingHostel ? 'Edit Hostel' : 'Create New Hostel'}
            </h2>

            {modalError && (
              <div className="alert alert-error text-xs mb-4">
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Hostel Name *</label>
                <input
                  type="text"
                  className="form-input w-full"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. BEC Boys Hostel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Hostel Code *</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MBH"
                  />
                </div>

                <div>
                  <label className="form-label">Type / Gender *</label>
                  <select
                    className="form-select w-full"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="BOYS">BOYS</option>
                    <option value="GIRLS">GIRLS</option>
                    <option value="COED">COED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Total Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input w-full"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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

              <div>
                <label className="form-label">Address</label>
                <textarea
                  className="form-textarea w-full"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Hostel address details..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-indigo">
                  {submitting ? 'Saving...' : (editingHostel ? 'Save Changes' : 'Create Hostel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterHostelsPage;
