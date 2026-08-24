import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const MasterRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [floors, setFloors] = useState([]);
  
  // Filter States
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [modalFloors, setModalFloors] = useState([]);
  const [formData, setFormData] = useState({
    hostel_id: '',
    floor_id: '',
    room_number: '',
    capacity: 2,
    status: 'ACTIVE'
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
    }
  }, [selectedHostelId]);

  useEffect(() => {
    fetchRooms();
  }, [page, selectedHostelId, selectedFloorId, searchTerm]);

  const loadHostels = async () => {
    try {
      const res = await api.getHostels({ limit: 100 });
      if (res.success) {
        setHostels(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load hostels:', err);
    }
  };

  const loadFloorsForFilter = async (hostelId) => {
    try {
      const res = await api.getFloors({ hostel_id: hostelId, limit: 100 });
      if (res.success) {
        setFloors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load floors:', err);
    }
  };

  const loadFloorsForModal = async (hostelId) => {
    try {
      const res = await api.getFloors({ hostel_id: hostelId, limit: 100 });
      if (res.success) {
        setModalFloors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load modal floors:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10, search: searchTerm };
      if (selectedHostelId) params.hostel_id = selectedHostelId;
      if (selectedFloorId) params.floor_id = selectedFloorId;

      const res = await api.getRooms(params);
      if (res.success) {
        setRooms(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || 'Failed to fetch rooms.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching rooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    const initialHostelId = selectedHostelId || (hostels[0]?.id || '');
    setFormData({
      hostel_id: initialHostelId,
      floor_id: '',
      room_number: '',
      capacity: 2,
      status: 'ACTIVE'
    });
    if (initialHostelId) loadFloorsForModal(initialHostelId);
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      hostel_id: room.hostel_id || '',
      floor_id: room.floor_id || '',
      room_number: room.room_number || '',
      capacity: room.capacity || 2,
      status: room.status || 'ACTIVE'
    });
    if (room.hostel_id) loadFloorsForModal(room.hostel_id);
    setModalError(null);
    setShowModal(true);
  };

  const handleModalHostelChange = (hostelId) => {
    setFormData({ ...formData, hostel_id: hostelId, floor_id: '' });
    if (hostelId) {
      loadFloorsForModal(hostelId);
    } else {
      setModalFloors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingRoom) {
        const res = await api.updateRoom(editingRoom.id, formData);
        if (res.success) {
          setShowModal(false);
          fetchRooms();
        } else {
          setModalError(res.message || 'Failed to update room.');
        }
      } else {
        const res = await api.createRoom(formData);
        if (res.success) {
          setShowModal(false);
          fetchRooms();
        } else {
          setModalError(res.message || 'Failed to create room.');
        }
      }
    } catch (err) {
      setModalError(err.message || 'An error occurred while saving room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id, roomNum) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomNum}"?`)) return;

    try {
      const res = await api.deleteRoom(id);
      if (res.success) {
        fetchRooms();
      } else {
        alert(res.message || 'Failed to delete room.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting room.');
    }
  };

  return (
    <div className="master-rooms-page">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="breadcrumbs text-sm text-gray-500 mb-1">
            <Link to="/admin/master" className="hover:underline">Master Data</Link> / <span>Rooms</span>
          </div>
          <h1 className="page-heading">🚪 Room Management</h1>
          <p className="page-subheading">Manage room numbers, bed capacities, and active/maintenance status.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-indigo flex items-center gap-2">
          <span>➕</span> Add New Room
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="search-bar-container bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Hostel Dropdown */}
          <select
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-52"
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
            className="form-select border rounded-md px-3 py-2 text-sm w-full sm:w-52 disabled:bg-gray-100"
            value={selectedFloorId}
            onChange={(e) => {
              setSelectedFloorId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Floors</option>
            {floors.map(f => (
              <option key={f.id} value={f.id}>{f.floor_name} (Level {f.floor_number})</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-52">
            <input
              type="text"
              className="form-input w-full pl-9 pr-4 py-2 border rounded-md text-sm"
              placeholder="Search room number..."
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
          Total Rooms: <span className="font-semibold text-gray-800">{pagination.total}</span>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      {/* Rooms Table / Cards */}
      {loading ? (
        <Loading message="Loading rooms list..." />
      ) : rooms.length === 0 ? (
        <div className="empty-state bg-white p-8 rounded-lg text-center border">
          <span className="text-4xl">🚪</span>
          <h3 className="font-bold text-gray-700 mt-2">No Rooms Found</h3>
          <p className="text-sm text-gray-500 mt-1">Adjust filters or create a new room in this floor.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Room Number</th>
                  <th className="p-4">Floor</th>
                  <th className="p-4">Hostel</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Occupancy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">Room {r.room_number}</td>
                    <td className="p-4 text-gray-600">{r.floor_name || 'Floor'}</td>
                    <td className="p-4 text-gray-600">{r.hostel_name || 'Hostel'}</td>
                    <td className="p-4 text-gray-600">{r.capacity} beds</td>
                    <td className="p-4 text-gray-600">
                      <span className="badge badge-gray">{r.occupied_beds ?? 0} / {r.capacity}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        r.status === 'ACTIVE' ? 'badge-success' : (r.status === 'MAINTENANCE' ? 'badge-warning' : 'badge-danger')
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(r)} className="btn btn-sm btn-outline">Edit</button>
                      <button onClick={() => handleDeleteRoom(r.id, r.room_number)} className="btn btn-sm btn-danger-outline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden grid-cols-1 gap-4 mb-6">
            {rooms.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">Room {r.room_number}</h3>
                    <span className="text-xs text-gray-500">{r.floor_name} • {r.hostel_name}</span>
                  </div>
                  <span className={`badge ${
                    r.status === 'ACTIVE' ? 'badge-success' : (r.status === 'MAINTENANCE' ? 'badge-warning' : 'badge-danger')
                  }`}>
                    {r.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <div>Capacity: <strong>{r.capacity} beds</strong></div>
                  <div>Occupancy: <strong>{r.occupied_beds ?? 0}/{r.capacity}</strong></div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => handleOpenEditModal(r)} className="btn btn-sm btn-outline">Edit</button>
                  <button onClick={() => handleDeleteRoom(r.id, r.room_number)} className="btn btn-sm btn-danger-outline">Delete</button>
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
              {editingRoom ? 'Edit Room' : 'Create New Room'}
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
                  onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                >
                  <option value="">-- Select Floor --</option>
                  {modalFloors.map(f => (
                    <option key={f.id} value={f.id}>{f.floor_name} (Level {f.floor_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Room Number *</label>
                <input
                  type="text"
                  className="form-input w-full"
                  required
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g. 101 / A-202"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Bed Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input w-full"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) })}
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
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-indigo">
                  {submitting ? 'Saving...' : (editingRoom ? 'Save Changes' : 'Create Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterRoomsPage;
