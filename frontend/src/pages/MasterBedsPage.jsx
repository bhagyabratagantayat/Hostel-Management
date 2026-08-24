import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const MasterBedsPage = () => {
  const [beds, setBeds] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Filter States
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [modalFloors, setModalFloors] = useState([]);
  const [modalRooms, setModalRooms] = useState([]);
  const [formData, setFormData] = useState({
    hostel_id: '',
    floor_id: '',
    room_id: '',
    bed_number: '',
    status: 'AVAILABLE'
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    if (selectedHostelId) {
      loadFloorsForFilter(selectedHostelId);
    } else {
      setFloors([]);
      setSelectedFloorId('');
      setRooms([]);
      setSelectedRoomId('');
    }
  }, [selectedHostelId]);

  useEffect(() => {
    if (selectedFloorId) {
      loadRoomsForFilter(selectedFloorId);
    } else {
      setRooms([]);
      setSelectedRoomId('');
    }
  }, [selectedFloorId]);

  useEffect(() => {
    fetchBeds();
  }, [page, selectedHostelId, selectedFloorId, selectedRoomId, searchTerm]);

  const loadHostels = async () => {
    try {
      const res = await api.getHostels({ limit: 100 });
      if (res.success) setHostels(res.data || []);
    } catch (err) {
      console.error('Failed to load hostels:', err);
    }
  };

  const loadFloorsForFilter = async (hostelId) => {
    try {
      const res = await api.getFloors({ hostel_id: hostelId, limit: 100 });
      if (res.success) setFloors(res.data || []);
    } catch (err) {
      console.error('Failed to load floors:', err);
    }
  };

  const loadRoomsForFilter = async (floorId) => {
    try {
      const res = await api.getRooms({ floor_id: floorId, limit: 100 });
      if (res.success) setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const loadFloorsForModal = async (hostelId) => {
    try {
      const res = await api.getFloors({ hostel_id: hostelId, limit: 100 });
      if (res.success) setModalFloors(res.data || []);
    } catch (err) {
      console.error('Failed to load modal floors:', err);
    }
  };

  const loadRoomsForModal = async (floorId) => {
    try {
      const res = await api.getRooms({ floor_id: floorId, limit: 100 });
      if (res.success) setModalRooms(res.data || []);
    } catch (err) {
      console.error('Failed to load modal rooms:', err);
    }
  };

  const fetchBeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10, search: searchTerm };
      if (selectedRoomId) params.room_id = selectedRoomId;

      const res = await api.getBeds(params);
      if (res.success) {
        setBeds(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setError(res.message || 'Failed to fetch beds.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching beds.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBed(null);
    const initialHostelId = selectedHostelId || (hostels[0]?.id || '');
    setFormData({
      hostel_id: initialHostelId,
      floor_id: selectedFloorId || '',
      room_id: selectedRoomId || '',
      bed_number: '',
      status: 'AVAILABLE'
    });
    if (initialHostelId) loadFloorsForModal(initialHostelId);
    if (selectedFloorId) loadRoomsForModal(selectedFloorId);
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (bed) => {
    setEditingBed(bed);
    setFormData({
      hostel_id: bed.hostel_id || '',
      floor_id: bed.floor_id || '',
      room_id: bed.room_id || '',
      bed_number: bed.bed_number || '',
      status: bed.status || 'AVAILABLE'
    });
    if (bed.hostel_id) loadFloorsForModal(bed.hostel_id);
    if (bed.floor_id) loadRoomsForModal(bed.floor_id);
    setModalError(null);
    setShowModal(true);
  };

  const handleModalHostelChange = (hostelId) => {
    setFormData({ ...formData, hostel_id: hostelId, floor_id: '', room_id: '' });
    setModalRooms([]);
    if (hostelId) loadFloorsForModal(hostelId);
    else setModalFloors([]);
  };

  const handleModalFloorChange = (floorId) => {
    setFormData({ ...formData, floor_id: floorId, room_id: '' });
    if (floorId) loadRoomsForModal(floorId);
    else setModalRooms([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingBed) {
        const res = await api.updateBed(editingBed.id, formData);
        if (res.success) {
          setShowModal(false);
          fetchBeds();
        } else {
          setModalError(res.message || 'Failed to update bed.');
        }
      } else {
        const res = await api.createBed(formData);
        if (res.success) {
          setShowModal(false);
          fetchBeds();
        } else {
          setModalError(res.message || 'Failed to create bed.');
        }
      }
    } catch (err) {
      setModalError(err.message || 'An error occurred while saving bed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = async (id, bedNum, status) => {
    if (status === 'OCCUPIED') {
      alert(`⚠️ Occupied bed "${bedNum}" cannot be deleted while assigned to a student.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete bed "${bedNum}"?`)) return;

    try {
      const res = await api.deleteBed(id);
      if (res.success) {
        fetchBeds();
      } else {
        alert(res.message || 'Failed to delete bed.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting bed.');
    }
  };

  return (
    <div className="master-beds-page">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="breadcrumbs text-sm text-gray-500 mb-1">
            <Link to="/admin/master" className="hover:underline">Master Data</Link> / <span>Beds</span>
          </div>
          <h1 className="page-heading">🛏️ Bed Management</h1>
          <p className="page-subheading">Manage bed identifiers, availability, and occupancy state guards.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-indigo flex items-center gap-2">
          <span>➕</span> Add New Bed
        </button>
      </div>

      {/* Cascading Filter Bar */}
      <div className="search-bar-container bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex gap-3 w-full lg:w-auto">
          {/* Hostel Dropdown */}
          <select
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-44"
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

          {/* Floor Dropdown */}
          <select
            disabled={!selectedHostelId}
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-44 disabled:bg-gray-100"
            value={selectedFloorId}
            onChange={(e) => {
              setSelectedFloorId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Floors</option>
            {floors.map(f => (
              <option key={f.id} value={f.id}>{f.floor_name}</option>
            ))}
          </select>

          {/* Room Dropdown */}
          <select
            disabled={!selectedFloorId}
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-44 disabled:bg-gray-100"
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Rooms</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>Room {r.room_number}</option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-44">
            <input
              type="text"
              className="form-input w-full pl-9 pr-4 py-2 border rounded-md text-sm"
              placeholder="Search bed..."
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
          Total Beds: <span className="font-semibold text-gray-800">{pagination.total}</span>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      {/* Beds Table / Cards */}
      {loading ? (
        <Loading message="Loading beds list..." />
      ) : beds.length === 0 ? (
        <div className="empty-state bg-white p-8 rounded-lg text-center border">
          <span className="text-4xl">🛏️</span>
          <h3 className="font-bold text-gray-700 mt-2">No Beds Found</h3>
          <p className="text-sm text-gray-500 mt-1">Adjust filters or create a new bed in this room.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Bed Number</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Hostel</th>
                  <th className="p-4">Assigned Student</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {beds.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">Bed {b.bed_number}</td>
                    <td className="p-4 text-gray-600">Room {b.room_number || '101'}</td>
                    <td className="p-4 text-gray-600">{b.hostel_name || 'Hostel'}</td>
                    <td className="p-4 text-gray-600">
                      {b.student_name ? (
                        <span className="text-indigo-600 font-medium">{b.student_name}</span>
                      ) : (
                        <span className="text-gray-400 font-normal">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        b.status === 'AVAILABLE' ? 'badge-success' : (b.status === 'OCCUPIED' ? 'badge-info' : 'badge-danger')
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(b)} className="btn btn-sm btn-outline">Edit</button>
                      <button
                        disabled={b.status === 'OCCUPIED'}
                        onClick={() => handleDeleteBed(b.id, b.bed_number, b.status)}
                        className="btn btn-sm btn-danger-outline disabled:opacity-50"
                        title={b.status === 'OCCUPIED' ? 'Cannot delete occupied bed' : ''}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden grid-cols-1 gap-4 mb-6">
            {beds.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">Bed {b.bed_number}</h3>
                    <span className="text-xs text-gray-500">Room {b.room_number} • {b.hostel_name}</span>
                  </div>
                  <span className={`badge ${
                    b.status === 'AVAILABLE' ? 'badge-success' : (b.status === 'OCCUPIED' ? 'badge-info' : 'badge-danger')
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Student: <strong>{b.student_name || 'Unassigned'}</strong></div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => handleOpenEditModal(b)} className="btn btn-sm btn-outline">Edit</button>
                  <button
                    disabled={b.status === 'OCCUPIED'}
                    onClick={() => handleDeleteBed(b.id, b.bed_number, b.status)}
                    className="btn btn-sm btn-danger-outline disabled:opacity-50"
                  >
                    Delete
                  </button>
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
              {editingBed ? 'Edit Bed' : 'Create New Bed'}
            </h2>

            {modalError && (
              <div className="alert alert-error text-xs mb-4">
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cascading Selection 1: Hostel */}
              <div>
                <label className="form-label">Hostel *</label>
                <select
                  className="form-select w-full"
                  required
                  value={formData.hostel_id}
                  onChange={(e) => handleModalHostelChange(e.target.value)}
                >
                  <option value="">-- Select Hostel --</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                  ))}
                </select>
              </div>

              {/* Cascading Selection 2: Floor */}
              <div>
                <label className="form-label">Floor *</label>
                <select
                  disabled={!formData.hostel_id}
                  className="form-select w-full disabled:bg-gray-100"
                  required
                  value={formData.floor_id}
                  onChange={(e) => handleModalFloorChange(e.target.value)}
                >
                  <option value="">-- Select Floor --</option>
                  {modalFloors.map(f => (
                    <option key={f.id} value={f.id}>{f.floor_name}</option>
                  ))}
                </select>
              </div>

              {/* Cascading Selection 3: Room */}
              <div>
                <label className="form-label">Room *</label>
                <select
                  disabled={!formData.floor_id}
                  className="form-select w-full disabled:bg-gray-100"
                  required
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                >
                  <option value="">-- Select Room --</option>
                  {modalRooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Bed Identifier *</label>
                <input
                  type="text"
                  className="form-input w-full"
                  required
                  value={formData.bed_number}
                  onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                  placeholder="e.g. Bed A / 101-1"
                />
              </div>

              <div>
                <label className="form-label">Status *</label>
                <select
                  className="form-select w-full"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-indigo">
                  {submitting ? 'Saving...' : (editingBed ? 'Save Changes' : 'Create Bed')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterBedsPage;
