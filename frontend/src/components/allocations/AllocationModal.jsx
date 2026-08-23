import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AllocationModal = ({ isOpen, onClose, onSuccess, hostels = [], unallocatedStudents = [] }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    hostel_id: '',
    room_id: '',
    bed_id: '',
    allocated_from: new Date().toISOString().slice(0, 10)
  });

  const [rooms, setRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        student_id: '',
        hostel_id: hostels.length > 0 ? hostels[0].id : '',
        room_id: '',
        bed_id: '',
        allocated_from: new Date().toISOString().slice(0, 10)
      });
      setRooms([]);
      setAvailableBeds([]);
      setError('');
    }
  }, [isOpen, hostels]);

  // Load rooms when hostel changes
  useEffect(() => {
    if (formData.hostel_id) {
      setLoadingRooms(true);
      api.getRooms({ hostel_id: formData.hostel_id })
        .then(res => {
          const roomList = res.data?.rooms || res.data || [];
          setRooms(roomList);
          setFormData(prev => ({ ...prev, room_id: '', bed_id: '' }));
        })
        .catch(err => {
          console.error('Failed to load rooms:', err);
          setRooms([]);
        })
        .finally(() => setLoadingRooms(false));
    } else {
      setRooms([]);
    }
  }, [formData.hostel_id]);

  // Load available beds when room changes
  useEffect(() => {
    if (formData.hostel_id && formData.room_id) {
      setLoadingBeds(true);
      api.getAvailableBeds(formData.hostel_id, formData.room_id)
        .then(res => {
          setAvailableBeds(res.data?.data || res.data || []);
          setFormData(prev => ({ ...prev, bed_id: '' }));
        })
        .catch(err => {
          console.error('Failed to load available beds:', err);
          setAvailableBeds([]);
        })
        .finally(() => setLoadingBeds(false));
    } else {
      setAvailableBeds([]);
    }
  }, [formData.hostel_id, formData.room_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.student_id) {
      return setError('Please select a student.');
    }
    if (!formData.hostel_id || !formData.room_id || !formData.bed_id) {
      return setError('Please complete Hostel, Room, and Bed selection.');
    }

    setSubmitting(true);
    try {
      await api.allocateStudent(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to allocate student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>New Room & Bed Allocation</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert alert-danger" style={{ margin: '15px 20px 0' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Select Student *</label>
            <select
              value={formData.student_id}
              onChange={e => setFormData({ ...formData, student_id: e.target.value })}
              required
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">-- Choose Student --</option>
              {unallocatedStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.student_id || s.roll_number})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Hostel *</label>
            <select
              value={formData.hostel_id}
              onChange={e => setFormData({ ...formData, hostel_id: e.target.value })}
              required
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">-- Choose Hostel --</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Room *</label>
            <select
              value={formData.room_id}
              onChange={e => setFormData({ ...formData, room_id: e.target.value })}
              disabled={!formData.hostel_id || loadingRooms}
              required
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">{loadingRooms ? 'Loading rooms...' : '-- Choose Room --'}</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>Room {r.room_number}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Available Bed *</label>
            <select
              value={formData.bed_id}
              onChange={e => setFormData({ ...formData, bed_id: e.target.value })}
              disabled={!formData.room_id || loadingBeds}
              required
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">{loadingBeds ? 'Loading available beds...' : '-- Choose Bed --'}</option>
              {availableBeds.map(b => (
                <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Allocation Start Date *</label>
            <input
              type="date"
              value={formData.allocated_from}
              onChange={e => setFormData({ ...formData, allocated_from: e.target.value })}
              required
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#4F46E5', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
            >
              {submitting ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocationModal;
