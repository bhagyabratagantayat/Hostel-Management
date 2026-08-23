import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Error from '../components/Error';

const StudentsPage = () => {
  const { user } = useAuth();
  
  // Lists and filtering state
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const limit = 10;

  // Modal control states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [actionLoading, setActionLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Dynamic cascading option states for dropdowns
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    student_id: '',
    roll_number: '',
    full_name: '',
    email: '',
    phone: '',
    branch: '',
    course: '',
    year: '1',
    semester: '1',
    password: '',
    hostel_id: '',
    floor_id: '',
    room_id: '',
    bed_id: '',
    base64Photo: ''
  });

  // Transfer Fields State
  const [transferData, setTransferData] = useState({
    new_hostel_id: '',
    new_floor_id: '',
    new_room_id: '',
    new_bed_id: ''
  });

  // Status Change Fields State
  const [statusData, setStatusData] = useState({
    status: 'INACTIVE'
  });

  // Fetch student records from the backend
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/students', {
        params: {
          page: currentPage,
          limit,
          search: search.trim() || undefined,
          hostel_id: hostelFilter || undefined,
          status: statusFilter || undefined
        }
      });
      setStudents(res.data.students || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalStudents(res.data.totalStudents || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch student directories.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hostels (filtered by RBAC on server side)
  const fetchHostels = async () => {
    try {
      const res = await api.get('/hostels');
      setHostels(res.data || []);
    } catch (err) {
      console.error('Failed to load hostels list:', err);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, hostelFilter, statusFilter]);

  // Handle live search execution
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  // Cascading lists helpers
  const handleHostelChange = async (hostelId, isTransfer = false) => {
    if (isTransfer) {
      setTransferData(prev => ({ ...prev, new_hostel_id: hostelId, new_floor_id: '', new_room_id: '', new_bed_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, hostel_id: hostelId, floor_id: '', room_id: '', bed_id: '' }));
    }
    setFloors([]);
    setRooms([]);
    setBeds([]);

    if (!hostelId) return;

    setFloorsLoading(true);
    try {
      const res = await api.get(`/floors?hostel_id=${hostelId}`);
      setFloors(res.data || []);
    } catch (err) {
      console.error('Failed to fetch floors:', err);
    } finally {
      setFloorsLoading(false);
    }
  };

  const handleFloorChange = async (floorId, isTransfer = false) => {
    if (isTransfer) {
      setTransferData(prev => ({ ...prev, new_floor_id: floorId, new_room_id: '', new_bed_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, floor_id: floorId, room_id: '', bed_id: '' }));
    }
    setRooms([]);
    setBeds([]);

    if (!floorId) return;

    setRoomsLoading(true);
    try {
      const res = await api.get(`/rooms?floor_id=${floorId}`);
      setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleRoomChange = async (roomId, isTransfer = false) => {
    if (isTransfer) {
      setTransferData(prev => ({ ...prev, new_room_id: roomId, new_bed_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, room_id: roomId, bed_id: '' }));
    }
    setBeds([]);

    if (!roomId) return;

    setBedsLoading(true);
    try {
      const res = await api.get(`/beds?room_id=${roomId}`);
      // Show only AVAILABLE beds for registration or transfer, 
      // or include currently assigned bed if in edit mode (not applicable to student creation)
      setBeds(res.data || []);
    } catch (err) {
      console.error('Failed to fetch beds:', err);
    } finally {
      setBedsLoading(false);
    }
  };

  // Convert uploaded image file to base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, base64Photo: 'Image size exceeds maximum limit of 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, base64Photo: reader.result }));
      setFormErrors(prev => ({ ...prev, base64Photo: null }));
    };
    reader.onerror = () => {
      setFormErrors(prev => ({ ...prev, base64Photo: 'Could not parse image file.' }));
    };
    reader.readAsDataURL(file);
  };

  // Open creation modal
  const handleOpenAddModal = () => {
    setFormData({
      student_id: '',
      roll_number: '',
      full_name: '',
      email: '',
      phone: '',
      branch: '',
      course: '',
      year: '1',
      semester: '1',
      password: '',
      hostel_id: '',
      floor_id: '',
      room_id: '',
      bed_id: '',
      base64Photo: ''
    });
    setFormErrors({});
    setFloors([]);
    setRooms([]);
    setBeds([]);
    setModalMode('add');
    setIsAddEditOpen(true);
  };

  // Open edit details modal
  const handleOpenEditModal = (student) => {
    setFormData({
      student_id: student.student_id,
      roll_number: student.roll_number,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone || '',
      branch: student.branch || '',
      course: student.course || '',
      year: student.year?.toString() || '1',
      semester: student.semester?.toString() || '1',
      password: '', // Password is not modified here
      hostel_id: student.hostel_id || '',
      floor_id: student.floor_id || '',
      room_id: student.room_id || '',
      bed_id: student.bed_id || '',
      base64Photo: '' // Stays blank unless uploading a new one
    });
    setSelectedStudent(student);
    setFormErrors({});
    setModalMode('edit');
    setIsAddEditOpen(true);
  };

  // Open transfer modal
  const handleOpenTransferModal = (student) => {
    setSelectedStudent(student);
    setTransferData({
      new_hostel_id: '',
      new_floor_id: '',
      new_room_id: '',
      new_bed_id: ''
    });
    setFloors([]);
    setRooms([]);
    setBeds([]);
    setIsTransferOpen(true);
  };

  // Open status updates modal
  const handleOpenStatusModal = (student) => {
    setSelectedStudent(student);
    setStatusData({
      status: student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    });
    setIsStatusOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    const errors = {};
    if (!formData.student_id.trim()) errors.student_id = 'Student ID is required.';
    if (!formData.roll_number.trim()) errors.roll_number = 'Roll number is required.';
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    
    if (modalMode === 'add') {
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
      if (!formData.hostel_id) errors.hostel_id = 'Hostel assignment is required.';
      if (!formData.floor_id) errors.floor_id = 'Floor assignment is required.';
      if (!formData.room_id) errors.room_id = 'Room assignment is required.';
      if (!formData.bed_id) errors.bed_id = 'Bed assignment is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setActionLoading(true);
    try {
      if (modalMode === 'add') {
        await api.post('/students', formData);
      } else {
        // Prepare update fields (filter out empty password / photo)
        const updatePayload = {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          branch: formData.branch,
          course: formData.course,
          year: parseInt(formData.year, 10),
          semester: parseInt(formData.semester, 10),
        };
        if (formData.base64Photo) {
          updatePayload.base64Photo = formData.base64Photo;
        }
        await api.put(`/students/${selectedStudent.id}`, updatePayload);
      }
      setIsAddEditOpen(false);
      fetchStudents();
    } catch (err) {
      setFormErrors({ form: err.message || 'Operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Transfer Form
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.new_hostel_id || !transferData.new_floor_id || !transferData.new_room_id || !transferData.new_bed_id) {
      setFormErrors({ form: 'Complete hostel, floor, room, and bed assignments are required.' });
      return;
    }

    setActionLoading(true);
    setFormErrors({});
    try {
      await api.post(`/students/${selectedStudent.id}/transfer`, {
        new_hostel_id: Number(transferData.new_hostel_id),
        new_floor_id: Number(transferData.new_floor_id),
        new_room_id: Number(transferData.new_room_id),
        new_bed_id: Number(transferData.new_bed_id)
      });
      setIsTransferOpen(false);
      fetchStudents();
    } catch (err) {
      setFormErrors({ form: err.message || 'Transfer failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Status Change Form
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormErrors({});
    try {
      await api.patch(`/students/${selectedStudent.id}/status`, {
        status: statusData.status
      });
      setIsStatusOpen(false);
      fetchStudents();
    } catch (err) {
      setFormErrors({ form: err.message || 'Failed to update student status.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-heading">Student Directory</h1>
          <p className="page-subheading">
            {user.role === 'SUPER_ADMIN' 
              ? 'Manage student credentials, allocations, transfers, and profiles campus-wide.' 
              : 'Warden console: View and register students allocated to your assigned hostels.'}
          </p>
        </div>
        <Button onClick={handleOpenAddModal} variant="primary">
          + Add New Student
        </Button>
      </div>

      {/* Filters and Search panel */}
      <Card className="filters-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Search Student</label>
            <Input 
              placeholder="Search by ID, roll, name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Filter by Hostel</label>
            <select
              value={hostelFilter}
              onChange={(e) => { setHostelFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ width: '100%', height: '40px', padding: '8px 12px' }}
            >
              <option value="">All Hostels</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ width: '100%', height: '40px', padding: '8px 12px' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="GRADUATED">GRADUATED</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary">Search</Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setSearch('');
                setHostelFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Student Directory Content */}
      {loading ? (
        <Loading message="Syncing student directories..." />
      ) : error ? (
        <Error message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <div className="empty-hostels-state">
          <p>No student records match your query.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table view */}
          <Card style={{ overflowX: 'auto', padding: 0 }}>
            <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '16px' }}>Student Details</th>
                  <th style={{ padding: '16px' }}>Academic Info</th>
                  <th style={{ padding: '16px' }}>Hostel Allocation</th>
                  <th style={{ padding: '16px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="student-row-hover">
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={student.full_name} 
                          className="student-photo-frame"
                        />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: 'var(--text-secondary)' }}>
                          {student.full_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{student.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: <code>{student.student_id}</code></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{student.email}</div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '500' }}>{student.course} - {student.branch}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Roll: {student.roll_number}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Year {student.year}, Sem {student.semester}</div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      {student.hostel_name ? (
                        <>
                          <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{student.hostel_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Room {student.room_number}, Bed {student.bed_number}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Not Allocated</span>
                      )}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span className={`hostel-gender-badge ${
                        student.status === 'ACTIVE' ? 'male' : 'female'
                      }`} style={{ textTransform: 'uppercase' }}>
                        {student.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => { setSelectedStudent(student); setIsDetailsOpen(true); }}
                          variant="secondary" 
                          className="btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          👁️ View
                        </Button>
                        <Button 
                          onClick={() => handleOpenEditModal(student)}
                          variant="secondary" 
                          className="btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          onClick={() => handleOpenTransferModal(student)}
                          variant="secondary" 
                          className="btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          disabled={student.status !== 'ACTIVE'}
                        >
                          🔄 Transfer
                        </Button>
                        <Button 
                          onClick={() => handleOpenStatusModal(student)}
                          variant={student.status === 'ACTIVE' ? 'danger' : 'primary'}
                          className="btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          {student.status === 'ACTIVE' ? '🛑 Deactivate' : '⚡ Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Showing <strong>{students.length}</strong> of <strong>{totalStudents}</strong> student accounts.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                >
                  Previous
                </Button>
                <span style={{ alignSelf: 'center', fontSize: '14px', padding: '0 8px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: View Profile Details */}
      {isDetailsOpen && selectedStudent && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '600px', padding: '24px', margin: 'auto' }}>
            <div className="login-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 className="login-title">Student Profile Card</h2>
                <p className="login-subtitle">Comprehensive registered student account information.</p>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {selectedStudent.photo_url ? (
                  <img 
                    src={selectedStudent.photo_url} 
                    alt={selectedStudent.full_name} 
                    style={{ width: '150px', height: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <div style={{ width: '150px', height: '150px', borderRadius: '8px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: 'var(--text-light)' }}>
                    🎓
                  </div>
                )}
                <span className={`hostel-gender-badge ${
                  selectedStudent.status === 'ACTIVE' ? 'male' : 'female'
                }`} style={{ fontSize: '12px', padding: '6px 12px', textTransform: 'uppercase' }}>
                  Status: {selectedStudent.status}
                </span>
              </div>

              <div style={{ flex: '2 2 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="profile-detail-row">
                  <span className="p-label">Full Name:</span>
                  <span className="p-val">{selectedStudent.full_name}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Student ID:</span>
                  <span className="p-val"><code>{selectedStudent.student_id}</code></span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Roll Number:</span>
                  <span className="p-val">{selectedStudent.roll_number}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Email Address:</span>
                  <span className="p-val">{selectedStudent.email}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Phone Number:</span>
                  <span className="p-val">{selectedStudent.phone || 'N/A'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Course & Branch:</span>
                  <span className="p-val">{selectedStudent.course} ({selectedStudent.branch})</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Year & Semester:</span>
                  <span className="p-val">Year {selectedStudent.year}, Semester {selectedStudent.semester}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Assigned Hostel:</span>
                  <span className="p-val hostel-highlight">{selectedStudent.hostel_name || 'Not Allocated'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Room & Bed:</span>
                  <span className="p-val">
                    {selectedStudent.room_number 
                      ? `Room ${selectedStudent.room_number}, Bed ${selectedStudent.bed_number}`
                      : 'Unassigned'}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="p-label">Admission Date:</span>
                  <span className="p-val">{selectedStudent.admission_date ? new Date(selectedStudent.admission_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setIsDetailsOpen(false)} variant="secondary">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register/Edit Student Profile */}
      {isAddEditOpen && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '95%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', margin: 'auto' }}>
            <div className="login-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 className="login-title">{modalMode === 'add' ? 'Register New Student' : 'Edit Student Details'}</h2>
                <p className="login-subtitle">Provide information to register or update the student profile.</p>
              </div>
              <button 
                onClick={() => setIsAddEditOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {formErrors.form && (
              <div className="login-error-alert">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">{formErrors.form}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input 
                  label="Student ID (Username) *"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                  error={formErrors.student_id}
                  disabled={modalMode === 'edit'}
                  required
                />
                
                <Input 
                  label="Roll Number *"
                  id="roll_number"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                  error={formErrors.roll_number}
                  disabled={modalMode === 'edit'}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input 
                  label="Full Name *"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  error={formErrors.full_name}
                  required
                />

                <Input 
                  label="Email Address *"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={formErrors.email}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input 
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />

                {modalMode === 'add' ? (
                  <Input 
                    label="Access Password (Min 6 chars) *"
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    error={formErrors.password}
                    required
                  />
                ) : (
                  <div className="form-group">
                    <label className="form-label" style={{ visibility: 'hidden' }}>Spacer</label>
                    <div style={{ color: 'var(--text-light)', fontSize: '13px', paddingTop: '10px' }}>
                      * Login password can be modified by the student or via administrative password resets.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input 
                  label="Course Title (e.g. B.Tech)"
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                />

                <Input 
                  label="Academic Branch (e.g. CSE)"
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="year">Current Year</label>
                  <select 
                    id="year" 
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="semester">Current Semester</label>
                  <select 
                    id="semester" 
                    value={formData.semester}
                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Upload input */}
              <div className="form-group">
                <label className="form-label">Profile Photo Uploader (Max 5MB)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
                {formErrors.base64Photo && <span className="form-error-msg">{formErrors.base64Photo}</span>}
                {formData.base64Photo && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={formData.base64Photo} 
                      alt="Upload Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--success-color)' }}>✓ Image ready for upload</span>
                  </div>
                )}
              </div>

              {/* BED ASSIGNMENT FLOW: Only visible on Student Creation */}
              {modalMode === 'add' && (
                <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', marginTop: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--primary-color)' }}>
                    🏢 Core Hostel Bed Assignment
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Select Hostel *</label>
                      <select 
                        value={formData.hostel_id} 
                        onChange={(e) => handleHostelChange(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                      >
                        <option value="">-- Choose Hostel --</option>
                        {hostels.map(h => (
                          <option key={h.id} value={h.id}>{h.name} ({h.gender})</option>
                        ))}
                      </select>
                      {formErrors.hostel_id && <span className="form-error-msg" style={{ fontSize: '11px' }}>{formErrors.hostel_id}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Select Floor *</label>
                      <select 
                        value={formData.floor_id} 
                        onChange={(e) => handleFloorChange(e.target.value)}
                        disabled={!formData.hostel_id || floorsLoading}
                        className="form-input"
                        style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                      >
                        <option value="">{floorsLoading ? 'Loading floors...' : '-- Choose Floor --'}</option>
                        {floors.map(f => (
                          <option key={f.id} value={f.id}>{f.floor_name} (Floor {f.floor_number})</option>
                        ))}
                      </select>
                      {formErrors.floor_id && <span className="form-error-msg" style={{ fontSize: '11px' }}>{formErrors.floor_id}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Select Room *</label>
                      <select 
                        value={formData.room_id} 
                        onChange={(e) => handleRoomChange(e.target.value)}
                        disabled={!formData.floor_id || roomsLoading}
                        className="form-input"
                        style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                      >
                        <option value="">{roomsLoading ? 'Loading rooms...' : '-- Choose Room --'}</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>Room {r.room_number} (Cap {r.capacity})</option>
                        ))}
                      </select>
                      {formErrors.room_id && <span className="form-error-msg" style={{ fontSize: '11px' }}>{formErrors.room_id}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Select Bed *</label>
                      <select 
                        value={formData.bed_id} 
                        onChange={(e) => setFormData(prev => ({ ...prev, bed_id: e.target.value }))}
                        disabled={!formData.room_id || bedsLoading}
                        className="form-input"
                        style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                      >
                        <option value="">{bedsLoading ? 'Loading beds...' : '-- Choose Bed --'}</option>
                        {beds.filter(b => b.status === 'AVAILABLE').map(b => (
                          <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                        ))}
                      </select>
                      {formErrors.bed_id && <span className="form-error-msg" style={{ fontSize: '11px' }}>{formErrors.bed_id}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={() => setIsAddEditOpen(false)} variant="secondary" type="button">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>
                  {modalMode === 'add' ? 'Register Student' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Transfer Bed Assignment */}
      {isTransferOpen && selectedStudent && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '500px', padding: '24px', margin: 'auto' }}>
            <div className="login-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 className="login-title">Transfer Student</h2>
                <p className="login-subtitle">Allocate <strong>{selectedStudent.full_name}</strong> to a different bed vacancy.</p>
              </div>
              <button 
                onClick={() => setIsTransferOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {formErrors.form && (
              <div className="login-error-alert">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">{formErrors.form}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
              Current Assignment: <strong style={{ color: 'var(--primary-color)' }}>{selectedStudent.hostel_name || 'Unassigned'}</strong>
              {selectedStudent.room_number ? ` (Room ${selectedStudent.room_number}, Bed ${selectedStudent.bed_number})` : ''}
            </div>

            <form onSubmit={handleTransferSubmit} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Destination Hostel *</label>
                <select 
                  value={transferData.new_hostel_id} 
                  onChange={(e) => handleHostelChange(e.target.value, true)}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="">-- Choose Hostel --</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Floor *</label>
                <select 
                  value={transferData.new_floor_id} 
                  onChange={(e) => handleFloorChange(e.target.value, true)}
                  disabled={!transferData.new_hostel_id || floorsLoading}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="">{floorsLoading ? 'Loading floors...' : '-- Choose Floor --'}</option>
                  {floors.map(f => (
                    <option key={f.id} value={f.id}>{f.floor_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Room *</label>
                <select 
                  value={transferData.new_room_id} 
                  onChange={(e) => handleRoomChange(e.target.value, true)}
                  disabled={!transferData.new_floor_id || roomsLoading}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="">{roomsLoading ? 'Loading rooms...' : '-- Choose Room --'}</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Available Destination Bed *</label>
                <select 
                  value={transferData.new_bed_id} 
                  onChange={(e) => setTransferData(prev => ({ ...prev, new_bed_id: e.target.value }))}
                  disabled={!transferData.new_room_id || bedsLoading}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="">{bedsLoading ? 'Loading beds...' : '-- Choose Bed --'}</option>
                  {beds.filter(b => b.status === 'AVAILABLE').map(b => (
                    <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={() => setIsTransferOpen(false)} variant="secondary" type="button">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>
                  Confirm Transfer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Deactivate/Archive Student Account */}
      {isStatusOpen && selectedStudent && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-box" style={{ width: '90%', maxWidth: '450px', padding: '24px', margin: 'auto' }}>
            <div className="login-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 className="login-title">Update Status / Deactivate</h2>
                <p className="login-subtitle">Alter the account and residency status of <strong>{selectedStudent.full_name}</strong>.</p>
              </div>
              <button 
                onClick={() => setIsStatusOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {formErrors.form && (
              <div className="login-error-alert">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">{formErrors.form}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="status-select">Select New Status *</label>
                <select 
                  id="status-select" 
                  value={statusData.status}
                  onChange={(e) => setStatusData({ status: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                >
                  <option value="ACTIVE">ACTIVE (Re-activate or Restore account)</option>
                  <option value="INACTIVE">INACTIVE (Deactivates access & releases assigned bed)</option>
                  <option value="GRADUATED">GRADUATED (Archive student & releases assigned bed)</option>
                </select>
              </div>

              <div style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: '1.4' }}>
                💡 <strong>Important Note:</strong> Switching a student to <code>INACTIVE</code> or <code>GRADUATED</code> will instantly release their currently assigned bed back to the availability pool. Re-activating an account later will require configuring a brand new bed allocation.
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={() => setIsStatusOpen(false)} variant="secondary" type="button">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>
                  Confirm Status Change
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
