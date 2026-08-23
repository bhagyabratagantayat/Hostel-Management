import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Error from '../components/Error';

const HostelDetailsPage = () => {
  const { hostelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [summary, setSummary] = useState(null);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('floors'); // 'floors' | 'rooms' | 'beds'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFloorFilter, setRoomFloorFilter] = useState('');
  const [bedRoomFilter, setBedRoomFilter] = useState('');
  const [bedStatusFilter, setBedStatusFilter] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'floor' | 'room' | 'bed' | null
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form states
  const [floorForm, setFloorForm] = useState({ floor_name: '', floor_number: '', status: 'ACTIVE' });
  const [roomForm, setRoomForm] = useState({ floor_id: '', room_number: '', capacity: '2', status: 'ACTIVE' });
  const [bedForm, setBedForm] = useState({ room_id: '', bed_number: '', status: 'AVAILABLE' });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, floorsRes, roomsRes, bedsRes] = await Promise.all([
        api.get(`/hostels/${hostelId}/summary`),
        api.get(`/floors?hostel_id=${hostelId}`),
        api.get(`/rooms?hostel_id=${hostelId}`),
        api.get(`/beds`) // Gets all beds, we will filter by hostel client-side
      ]);

      setSummary(summaryRes.data);
      setFloors(floorsRes.data || []);
      setRooms(roomsRes.data || []);
      
      // Filter beds belonging to this hostel's rooms
      const hostelRoomsIds = (roomsRes.data || []).map(r => r.id);
      const filteredBeds = (bedsRes.data || []).filter(b => hostelRoomsIds.includes(b.room_id));
      setBeds(filteredBeds);
    } catch (err) {
      setError(err.message || 'Failed to load hostel details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostelId]);

  // Floor CRUD handlers
  const handleOpenFloorModal = (mode, floor = null) => {
    setModalMode(mode);
    setModalError(null);
    if (mode === 'add') {
      setFloorForm({ floor_name: '', floor_number: '', status: 'ACTIVE' });
    } else if (floor) {
      setFloorForm({
        floor_name: floor.floor_name,
        floor_number: floor.floor_number,
        status: floor.status
      });
      setSelectedEntityId(floor.id);
    }
    setActiveModal('floor');
  };

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    if (!floorForm.floor_name.trim() || floorForm.floor_number === '') {
      setModalError('All fields are required.');
      return;
    }
    setActionLoading(true);
    setModalError(null);
    try {
      if (modalMode === 'add') {
        await api.post('/floors', { ...floorForm, hostel_id: hostelId });
      } else {
        await api.put(`/floors/${selectedEntityId}`, floorForm);
      }
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Floor save failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFloor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete floor "${name}"?`)) return;
    try {
      await api.delete(`/floors/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete floor.');
    }
  };

  // Room CRUD handlers
  const handleOpenRoomModal = (mode, room = null) => {
    setModalMode(mode);
    setModalError(null);
    if (mode === 'add') {
      setRoomForm({
        floor_id: floors.length > 0 ? floors[0].id : '',
        room_number: '',
        capacity: '2',
        status: 'ACTIVE'
      });
    } else if (room) {
      setRoomForm({
        floor_id: room.floor_id,
        room_number: room.room_number,
        capacity: room.capacity.toString(),
        status: room.status
      });
      setSelectedEntityId(room.id);
    }
    setActiveModal('room');
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!roomForm.room_number.trim() || !roomForm.floor_id || roomForm.capacity === '') {
      setModalError('All fields are required.');
      return;
    }
    setActionLoading(true);
    setModalError(null);
    try {
      if (modalMode === 'add') {
        await api.post('/rooms', { ...roomForm, hostel_id: hostelId });
      } else {
        await api.put(`/rooms/${selectedEntityId}`, { ...roomForm, hostel_id: hostelId });
      }
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Room save failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (id, number) => {
    if (!window.confirm(`Are you sure you want to delete Room ${number}?`)) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete room.');
    }
  };

  // Bed CRUD handlers
  const handleOpenBedModal = (mode, bed = null) => {
    setModalMode(mode);
    setModalError(null);
    if (mode === 'add') {
      setBedForm({
        room_id: rooms.length > 0 ? rooms[0].id : '',
        bed_number: '',
        status: 'AVAILABLE'
      });
    } else if (bed) {
      setBedForm({
        room_id: bed.room_id,
        bed_number: bed.bed_number,
        status: bed.status
      });
      setSelectedEntityId(bed.id);
    }
    setActiveModal('bed');
  };

  const handleBedSubmit = async (e) => {
    e.preventDefault();
    if (!bedForm.bed_number.trim() || !bedForm.room_id) {
      setModalError('All fields are required.');
      return;
    }
    setActionLoading(true);
    setModalError(null);
    try {
      if (modalMode === 'add') {
        await api.post('/beds', bedForm);
      } else {
        await api.put(`/beds/${selectedEntityId}`, bedForm);
      }
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Bed save failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBed = async (id, number) => {
    if (!window.confirm(`Are you sure you want to delete Bed ${number}?`)) return;
    try {
      await api.delete(`/beds/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete bed.');
    }
  };

  // Capacity calculations for selected room in bed form
  const getSelectedRoomStats = () => {
    const roomId = parseInt(bedForm.room_id, 10);
    if (!roomId) return null;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;
    const roomBeds = beds.filter(b => b.room_id === roomId);
    return {
      capacity: room.capacity,
      existingCount: roomBeds.length,
      availableSlots: room.capacity - roomBeds.length
    };
  };

  const roomStats = getSelectedRoomStats();

  if (loading) return <Loading message="Loading hostel configuration..." />;
  if (error) return <Error message={error} onRetry={fetchData} />;

  // Filter calculations
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.room_number.toLowerCase().includes(roomSearch.toLowerCase());
    const matchesFloor = roomFloorFilter ? r.floor_id === parseInt(roomFloorFilter, 10) : true;
    return matchesSearch && matchesFloor;
  });

  const filteredBeds = beds.filter(b => {
    const matchesRoom = bedRoomFilter ? b.room_id === parseInt(bedRoomFilter, 10) : true;
    const matchesStatus = bedStatusFilter ? b.status === bedStatusFilter : true;
    return matchesRoom && matchesStatus;
  });

  return (
    <div className="dashboard-page">
      {/* Back button and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button onClick={() => navigate(-1)} variant="secondary" style={{ padding: '6px 12px' }}>
          ← Back
        </Button>
        <div>
          <h1 className="page-heading">{summary?.hostel?.name}</h1>
          <p className="page-subheading">{summary?.hostel?.location} • Code: <code>{summary?.hostel?.code}</code></p>
        </div>
      </div>

      {/* Summary statistics grid */}
      <div className="status-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card title="Floors" className="status-card" style={{ textAlign: 'center' }}>
          <div className="page-heading" style={{ color: 'var(--primary-color)' }}>{summary?.statistics?.floors}</div>
        </Card>
        <Card title="Rooms" className="status-card" style={{ textAlign: 'center' }}>
          <div className="page-heading" style={{ color: 'var(--primary-color)' }}>{summary?.statistics?.rooms}</div>
        </Card>
        <Card title="Total Beds" className="status-card" style={{ textAlign: 'center' }}>
          <div className="page-heading" style={{ color: 'var(--primary-color)' }}>{summary?.statistics?.beds}</div>
        </Card>
        <Card title="Available Beds" className="status-card" style={{ textAlign: 'center' }}>
          <div className="page-heading" style={{ color: 'var(--success-color)' }}>{summary?.statistics?.availableBeds}</div>
        </Card>
        <Card title="Occupied Beds" className="status-card" style={{ textAlign: 'center' }}>
          <div className="page-heading" style={{ color: 'var(--text-secondary)' }}>{summary?.statistics?.occupiedBeds}</div>
        </Card>
      </div>

      {/* Tabs Explorer Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', gap: '16px', margin: '24px 0 16px 0' }}>
        <button 
          onClick={() => setActiveTab('floors')}
          style={{ 
            padding: '8px 16px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'floors' ? '3px solid var(--primary-color)' : '3px solid transparent', 
            color: activeTab === 'floors' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Floors Explorer ({floors.length})
        </button>
        <button 
          onClick={() => setActiveTab('rooms')}
          style={{ 
            padding: '8px 16px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'rooms' ? '3px solid var(--primary-color)' : '3px solid transparent', 
            color: activeTab === 'rooms' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Rooms Explorer ({rooms.length})
        </button>
        <button 
          onClick={() => setActiveTab('beds')}
          style={{ 
            padding: '8px 16px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'beds' ? '3px solid var(--primary-color)' : '3px solid transparent', 
            color: activeTab === 'beds' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Beds Explorer ({beds.length})
        </button>
      </div>

      {/* --- FLOORS TAB --- */}
      {activeTab === 'floors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title">Configure Floors</h3>
            <Button onClick={() => handleOpenFloorModal('add')} variant="primary" style={{ padding: '8px 16px' }}>
              + Add Floor
            </Button>
          </div>

          {floors.length === 0 ? (
            <div className="empty-hostels-state">
              <p>No floors have been configured in this hostel yet.</p>
            </div>
          ) : (
            <div className="hostels-grid">
              {floors.map(floor => (
                <Card 
                  key={floor.id} 
                  title={floor.floor_name}
                  footer={
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                      <Button onClick={() => handleOpenFloorModal('edit', floor)} variant="secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Edit
                      </Button>
                      <Button onClick={() => handleDeleteFloor(floor.id, floor.floor_name)} variant="danger" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Delete
                      </Button>
                    </div>
                  }
                >
                  <div className="hostel-detail-item">
                    <span className="detail-label">Floor Number:</span>
                    <span className="detail-value">{floor.floor_number}</span>
                  </div>
                  <div className="hostel-detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value ${floor.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                      ● {floor.status}
                    </span>
                  </div>
                  <div className="hostel-detail-item">
                    <span className="detail-label">Rooms Configured:</span>
                    <span className="detail-value">{rooms.filter(r => r.floor_id === floor.id).length}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ROOMS TAB --- */}
      {activeTab === 'rooms' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div className="search-filter-container" style={{ width: '100%', maxWidth: '600px' }}>
              <Input 
                placeholder="Search room number..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                style={{ flexGrow: 1 }}
              />
              <select 
                value={roomFloorFilter}
                onChange={(e) => setRoomFloorFilter(e.target.value)}
                className="form-input"
                style={{ width: '180px', height: '40px', padding: '8px 12px' }}
              >
                <option value="">All Floors</option>
                {floors.map(f => (
                  <option key={f.id} value={f.id}>{f.floor_name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => handleOpenRoomModal('add')} variant="primary" style={{ padding: '8px 16px' }}>
              + Add Room
            </Button>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="empty-hostels-state">
              <p>No rooms found matching filters.</p>
            </div>
          ) : (
            <div className="hostels-grid">
              {filteredRooms.map(room => {
                const roomBeds = beds.filter(b => b.room_id === room.id);
                return (
                  <Card 
                    key={room.id}
                    title={`Room ${room.room_number}`}
                    footer={
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                        <Button onClick={() => handleOpenRoomModal('edit', room)} variant="secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          Edit
                        </Button>
                        <Button onClick={() => handleDeleteRoom(room.id, room.room_number)} variant="danger" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          Delete
                        </Button>
                      </div>
                    }
                  >
                    <div className="hostel-detail-item">
                      <span className="detail-label">Floor:</span>
                      <span className="detail-value">{room.floor_name}</span>
                    </div>
                    <div className="hostel-detail-item">
                      <span className="detail-label">Max Capacity:</span>
                      <span className="detail-value">{room.capacity} beds</span>
                    </div>
                    <div className="hostel-detail-item">
                      <span className="detail-label">Beds Installed:</span>
                      <span className="detail-value">{roomBeds.length} / {room.capacity}</span>
                    </div>
                    <div className="hostel-detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value ${room.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                        ● {room.status}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- BEDS TAB --- */}
      {activeTab === 'beds' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div className="search-filter-container" style={{ width: '100%', maxWidth: '600px' }}>
              <select 
                value={bedRoomFilter}
                onChange={(e) => setBedRoomFilter(e.target.value)}
                className="form-input"
                style={{ width: '200px', height: '40px', padding: '8px 12px' }}
              >
                <option value="">All Rooms</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_number}</option>
                ))}
              </select>
              <select 
                value={bedStatusFilter}
                onChange={(e) => setBedStatusFilter(e.target.value)}
                className="form-input"
                style={{ width: '180px', height: '40px', padding: '8px 12px' }}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <Button onClick={() => handleOpenBedModal('add')} variant="primary" style={{ padding: '8px 16px' }}>
              + Add Bed
            </Button>
          </div>

          {filteredBeds.length === 0 ? (
            <div className="empty-hostels-state">
              <p>No beds found matching filters.</p>
            </div>
          ) : (
            <div className="hostels-grid">
              {filteredBeds.map(bed => (
                <Card 
                  key={bed.id}
                  title={`Bed ${bed.bed_number}`}
                  footer={
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                      <Button onClick={() => handleOpenBedModal('edit', bed)} variant="secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Edit
                      </Button>
                      <Button onClick={() => handleDeleteBed(bed.id, bed.bed_number)} variant="danger" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Delete
                      </Button>
                    </div>
                  }
                >
                  <div className="hostel-detail-item">
                    <span className="detail-label">Room Number:</span>
                    <span className="detail-value">Room {bed.room_number}</span>
                  </div>
                  <div className="hostel-detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value`} style={{ color: bed.status === 'AVAILABLE' ? 'var(--success-color)' : bed.status === 'OCCUPIED' ? 'var(--primary-color)' : 'var(--warning-color)' }}>
                      ● {bed.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floor Form Modal */}
      {activeModal === 'floor' && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '450px', padding: '24px', margin: 'auto' }}>
            <h2 className="login-title">{modalMode === 'add' ? 'Add Floor' : 'Edit Floor'}</h2>
            {modalError && <div className="login-error-alert"><span className="alert-text">{modalError}</span></div>}
            
            <form onSubmit={handleFloorSubmit} className="login-form">
              <Input 
                label="Floor Name"
                id="floor_name"
                name="floor_name"
                value={floorForm.floor_name}
                onChange={e => setFloorForm(prev => ({ ...prev, floor_name: e.target.value }))}
                required
              />

              <Input 
                label="Floor Number (Integer)"
                id="floor_number"
                name="floor_number"
                type="number"
                value={floorForm.floor_number}
                onChange={e => setFloorForm(prev => ({ ...prev, floor_number: e.target.value }))}
                required
              />

              <div className="form-group">
                <label className="form-label" htmlFor="floor_status">Floor Status *</label>
                <select 
                  id="floor_status" 
                  value={floorForm.status}
                  onChange={e => setFloorForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={() => setActiveModal(null)} variant="secondary">Cancel</Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Form Modal */}
      {activeModal === 'room' && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '450px', padding: '24px', margin: 'auto' }}>
            <h2 className="login-title">{modalMode === 'add' ? 'Add Room' : 'Edit Room'}</h2>
            {modalError && <div className="login-error-alert"><span className="alert-text">{modalError}</span></div>}

            {floors.length === 0 ? (
              <div style={{ margin: '16px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger-color)' }}>Please create at least one floor before adding rooms.</p>
                <Button onClick={() => setActiveModal(null)} variant="secondary" style={{ marginTop: '12px' }}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleRoomSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="room_floor_id">Select Floor *</label>
                  <select 
                    id="room_floor_id" 
                    value={roomForm.floor_id}
                    onChange={e => setRoomForm(prev => ({ ...prev, floor_id: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                  >
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.floor_name}</option>
                    ))}
                  </select>
                </div>

                <Input 
                  label="Room Number"
                  id="room_number"
                  name="room_number"
                  value={roomForm.room_number}
                  onChange={e => setRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
                  required
                />

                <Input 
                  label="Room Capacity (Beds Count)"
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={e => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                  required
                />

                <div className="form-group">
                  <label className="form-label" htmlFor="room_status">Room Status *</label>
                  <select 
                    id="room_status" 
                    value={roomForm.status}
                    onChange={e => setRoomForm(prev => ({ ...prev, status: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Button onClick={() => setActiveModal(null)} variant="secondary">Cancel</Button>
                  <Button type="submit" variant="primary" isLoading={actionLoading}>Save</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bed Form Modal */}
      {activeModal === 'bed' && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '450px', padding: '24px', margin: 'auto' }}>
            <h2 className="login-title">{modalMode === 'add' ? 'Add Bed' : 'Edit Bed'}</h2>
            {modalError && <div className="login-error-alert"><span className="alert-text">{modalError}</span></div>}

            {rooms.length === 0 ? (
              <div style={{ margin: '16px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger-color)' }}>Please create at least one room before adding beds.</p>
                <Button onClick={() => setActiveModal(null)} variant="secondary" style={{ marginTop: '12px' }}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleBedSubmit} className="login-form">
                {modalMode === 'add' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="bed_room_id">Select Room *</label>
                    <select 
                      id="bed_room_id" 
                      value={bedForm.room_id}
                      onChange={e => setBedForm(prev => ({ ...prev, room_id: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>Room {r.room_number}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Capacity statistics details */}
                {modalMode === 'add' && roomStats && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Room Capacity: <strong>{roomStats.capacity}</strong></div>
                    <div>Existing Beds: <strong>{roomStats.existingCount}</strong></div>
                    <div>Remaining Slots: <strong style={{ color: roomStats.availableSlots > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{roomStats.availableSlots}</strong></div>
                  </div>
                )}

                <Input 
                  label="Bed Number / Label"
                  id="bed_number"
                  name="bed_number"
                  value={bedForm.bed_number}
                  onChange={e => setBedForm(prev => ({ ...prev, bed_number: e.target.value }))}
                  required
                />

                <div className="form-group">
                  <label className="form-label" htmlFor="bed_status">Bed Status *</label>
                  <select 
                    id="bed_status" 
                    value={bedForm.status}
                    onChange={e => setBedForm(prev => ({ ...prev, status: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Button onClick={() => setActiveModal(null)} variant="secondary">Cancel</Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    isLoading={actionLoading}
                    disabled={modalMode === 'add' && roomStats && roomStats.availableSlots <= 0}
                  >
                    Save
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelDetailsPage;
