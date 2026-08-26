import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Error from '../components/Error';
import './StudentsPage.css';

export const COURSE_PROGRAMS = ['B.Tech', 'Diploma', 'MBA'];

export const COURSE_BRANCH_MAP = {
  'B.Tech': [
    'Computer Science & Engineering (CSE)',
    'Aeronautical Engineering',
    'Aircraft Maintenance Engineering (AME)',
    'Civil Engineering',
    'Electrical Engineering',
    'Electronics & Communication Engineering (ECE)',
    'Mechanical Engineering',
    'Agriculture Engineering'
  ],
  'Diploma': [
    'Aeronautical Engineering',
    'Aircraft Maintenance Engineering (AME)',
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering'
  ],
  'MBA': [
    'Marketing',
    'Finance',
    'Human Resource',
    'Agri-Business'
  ]
};

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
  const [courseFilter, setCourseFilter] = useState('');
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
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomBranch, setIsCustomBranch] = useState(false);

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
    date_of_birth: '',
    email: '',
    phone: '',
    branch: '',
    course: 'B.Tech',
    year: '1',
    semester: '1',
    password: '',
    hostel_id: '',
    floor_id: '',
    room_id: '',
    bed_id: '',
    base64Photo: ''
  });

  // Automatically convert DOB (YYYY-MM-DD) into default DDMMYYYY password
  const handleDobChange = (dobString) => {
    let autoPassword = '';
    if (dobString && /^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
      const [yyyy, mm, dd] = dobString.split('-');
      autoPassword = `${dd}${mm}${yyyy}`;
    }
    setFormData(prev => ({
      ...prev,
      date_of_birth: dobString,
      password: modalMode === 'add' ? autoPassword : prev.password
    }));
  };

  // Dynamically switch course and reset branch selection
  const handleCourseChange = (newCourse) => {
    const defaultBranch = COURSE_BRANCH_MAP[newCourse]?.[0] || '';
    setFormData(prev => ({
      ...prev,
      course: newCourse,
      branch: defaultBranch
    }));
    setIsCustomBranch(false);
  };

  // Branch selection handler with custom branch support
  const handleBranchChange = (newBranch) => {
    if (newBranch === 'OTHER') {
      setIsCustomBranch(true);
      setFormData(prev => ({ ...prev, branch: '' }));
    } else {
      setIsCustomBranch(false);
      setFormData(prev => ({ ...prev, branch: newBranch }));
    }
  };

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

  // Keyboard shortcut (Escape) to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDetailsOpen(false);
        setIsAddEditOpen(false);
        setIsTransferOpen(false);
        setIsStatusOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          status: statusFilter || undefined,
          course: courseFilter || undefined
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
  }, [currentPage, hostelFilter, statusFilter, courseFilter]);

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
    setRoomsLoading(true);
    try {
      const [floorsRes, roomsRes] = await Promise.all([
        api.get(`/floors?hostel_id=${hostelId}`),
        api.get(`/rooms?hostel_id=${hostelId}`)
      ]);
      setFloors(floorsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch floors / rooms:', err);
    } finally {
      setFloorsLoading(false);
      setRoomsLoading(false);
    }
  };

  const handleFloorChange = async (floorId, isTransfer = false) => {
    const hostelId = isTransfer ? transferData.new_hostel_id : formData.hostel_id;
    if (isTransfer) {
      setTransferData(prev => ({ ...prev, new_floor_id: floorId, new_room_id: '', new_bed_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, floor_id: floorId, room_id: '', bed_id: '' }));
    }
    setRooms([]);
    setBeds([]);

    setRoomsLoading(true);
    try {
      const url = floorId ? `/rooms?floor_id=${floorId}` : `/rooms?hostel_id=${hostelId}`;
      const res = await api.get(url);
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
    const defaultCourse = 'B.Tech';
    const defaultBranch = COURSE_BRANCH_MAP['B.Tech'][0];
    setFormData({
      student_id: '',
      roll_number: '',
      full_name: '',
      date_of_birth: '',
      email: '',
      phone: '',
      branch: defaultBranch,
      course: defaultCourse,
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
    setIsCustomBranch(false);
    setShowPassword(false);
    setModalMode('add');
    setIsAddEditOpen(true);
  };

  // Open edit details modal
  const handleOpenEditModal = (student) => {
    const currentCourse = student.course || 'B.Tech';
    const currentBranch = student.branch || '';
    const branchesForCourse = COURSE_BRANCH_MAP[currentCourse] || [];
    const isOther = currentBranch && !branchesForCourse.includes(currentBranch);
    setIsCustomBranch(Boolean(isOther));
    setShowPassword(false);

    let dobFormatted = '';
    if (student.date_of_birth) {
      try {
        dobFormatted = new Date(student.date_of_birth).toISOString().split('T')[0];
      } catch (e) {
        dobFormatted = student.date_of_birth;
      }
    }

    setFormData({
      student_id: student.student_id,
      roll_number: student.roll_number,
      full_name: student.full_name,
      date_of_birth: dobFormatted,
      email: student.email,
      phone: student.phone || '',
      branch: currentBranch,
      course: currentCourse,
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
    if (!formData.student_id.trim()) errors.student_id = 'Registration Number (User ID) is required.';
    if (!formData.roll_number.trim()) errors.roll_number = 'Roll number is required.';
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    if (!formData.date_of_birth) errors.date_of_birth = 'Date of Birth is required.';
    
    if (modalMode === 'add') {
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters (enter Date of Birth).';
      }
      if (!formData.hostel_id) errors.hostel_id = 'Hostel assignment is required.';
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
        await api.post('/students', {
          ...formData,
          date_of_birth: formData.date_of_birth || null
        });
      } else {
        // Prepare update fields (filter out empty password / photo)
        const updatePayload = {
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth || null,
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
      setFormErrors({ form: err.response?.data?.message || err.message || 'Operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Transfer Form
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.new_hostel_id || !transferData.new_room_id || !transferData.new_bed_id) {
      setFormErrors({ form: 'Complete destination hostel, room, and bed assignments are required.' });
      return;
    }

    setActionLoading(true);
    setFormErrors({});
    try {
      await api.post(`/students/${selectedStudent.id}/transfer`, {
        new_hostel_id: Number(transferData.new_hostel_id),
        new_floor_id: transferData.new_floor_id ? Number(transferData.new_floor_id) : null,
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

          <div style={{ width: '160px' }}>
            <label className="form-label" style={{ fontSize: '13px' }}>Filter by Course</label>
            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ width: '100%', height: '40px', padding: '8px 12px' }}
            >
              <option value="">All Courses</option>
              {COURSE_PROGRAMS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
                setCourseFilter('');
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
        <div className="custom-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsOpen(false); }}>
          <div className="custom-modal-container" style={{ maxWidth: '640px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-header-content">
                <h2 className="custom-modal-title">🎓 Student Profile Details</h2>
                <p className="custom-modal-subtitle">Comprehensive registered student account information.</p>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="custom-modal-close-btn"
                aria-label="Close modal"
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="custom-modal-body">
              <div className="profile-modal-grid">
                <div className="profile-avatar-container">
                  {selectedStudent.photo_url ? (
                    <img 
                      src={selectedStudent.photo_url} 
                      alt={selectedStudent.full_name} 
                      className="profile-avatar-img"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      🎓
                    </div>
                  )}
                  <span className={`hostel-gender-badge ${
                    selectedStudent.status === 'ACTIVE' ? 'male' : 'female'
                  }`} style={{ fontSize: '12px', padding: '6px 12px', textTransform: 'uppercase', borderRadius: '20px', fontWeight: 600 }}>
                    ● {selectedStudent.status}
                  </span>
                </div>

                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <span className="profile-info-label">Full Name</span>
                    <span className="profile-info-value">{selectedStudent.full_name}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Registration No. (User ID)</span>
                    <span className="profile-info-value"><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>{selectedStudent.student_id}</code></span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Date of Birth</span>
                    <span className="profile-info-value">
                      {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-GB') : 'Not Specified'}
                    </span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Roll Number</span>
                    <span className="profile-info-value">{selectedStudent.roll_number}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Email Address</span>
                    <span className="profile-info-value">{selectedStudent.email}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Phone Number</span>
                    <span className="profile-info-value">{selectedStudent.phone || 'N/A'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Course & Branch</span>
                    <span className="profile-info-value">{selectedStudent.course || 'N/A'} ({selectedStudent.branch || 'N/A'})</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Year & Semester</span>
                    <span className="profile-info-value">Year {selectedStudent.year}, Semester {selectedStudent.semester}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Assigned Hostel</span>
                    <span className="profile-info-value" style={{ color: '#2563eb' }}>{selectedStudent.hostel_name || 'Not Allocated'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Room & Bed</span>
                    <span className="profile-info-value">
                      {selectedStudent.room_number 
                        ? `Room ${selectedStudent.room_number}, Bed ${selectedStudent.bed_number}`
                        : 'Unassigned'}
                    </span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Admission Date</span>
                    <span className="profile-info-value">{selectedStudent.admission_date ? new Date(selectedStudent.admission_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="custom-modal-footer">
              <Button onClick={() => setIsDetailsOpen(false)} variant="secondary">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register/Edit Student Profile */}
      {isAddEditOpen && (
        <div className="custom-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddEditOpen(false); }}>
          <div className="custom-modal-container" style={{ maxWidth: '680px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-header-content">
                <h2 className="custom-modal-title">
                  {modalMode === 'add' ? '✨ Register New Student' : '✏️ Edit Student Details'}
                </h2>
                <p className="custom-modal-subtitle">Provide information to register or update the student profile.</p>
              </div>
              <button 
                onClick={() => setIsAddEditOpen(false)}
                className="custom-modal-close-btn"
                aria-label="Close modal"
                title="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="custom-modal-body">
                {formErrors.form && (
                  <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">{formErrors.form}</span>
                  </div>
                )}

                <div className="modal-form-grid-2">
                  <div>
                    <Input 
                      label="Registration Number (User ID) *"
                      id="student_id"
                      name="student_id"
                      placeholder="e.g. 2301316095"
                      autoComplete="new-student-id"
                      value={formData.student_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                      error={formErrors.student_id}
                      disabled={modalMode === 'edit'}
                      required
                    />
                    <small style={{ display: 'block', marginTop: '-8px', marginBottom: '12px', fontSize: '11px', color: '#64748b' }}>
                      🔑 Official registration number used for student portal login.
                    </small>
                  </div>
                  
                  <Input 
                    label="College Roll Number *"
                    id="roll_number"
                    name="roll_number"
                    placeholder="e.g. CSE-042"
                    value={formData.roll_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                    error={formErrors.roll_number}
                    disabled={modalMode === 'edit'}
                    required
                  />
                </div>

                <div className="modal-form-grid-2">
                  <Input 
                    label="Student Full Name *"
                    id="full_name"
                    name="full_name"
                    placeholder="e.g. Soumya Ranjan Panda"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    error={formErrors.full_name}
                    required
                  />

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="date_of_birth">
                      Date of Birth *
                    </label>
                    <input 
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                      required
                    />
                    {formErrors.date_of_birth && <span className="form-error-msg">{formErrors.date_of_birth}</span>}
                    <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                      📅 Used as the default login password (format DDMMYYYY).
                    </small>
                  </div>
                </div>

                <div className="modal-form-grid-2">
                  <Input 
                    label="Email Address *"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    error={formErrors.email}
                    required
                  />

                  <Input 
                    label="Phone Number"
                    id="phone"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {modalMode === 'add' ? (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="password">
                      Access Password (Auto-set from DOB) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="form-input"
                        placeholder="Select DOB to auto-generate password"
                        style={{ width: '100%', height: '42px', padding: '8px 40px 8px 12px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '15px',
                          color: '#64748b'
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                    {formErrors.password && <span className="form-error-msg">{formErrors.password}</span>}
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#0369a1', background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                      💡 <strong>Student Login Credentials:</strong><br />
                      • <strong>User ID:</strong> <code>{formData.student_id || 'Enter Registration No.'}</code><br />
                      • <strong>Default Password:</strong> <code>{formData.password || 'Select Date of Birth (DDMMYYYY)'}</code>
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ color: '#64748b', fontSize: '13px' }}>Password Management</label>
                    <div style={{ color: '#94a3b8', fontSize: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      Password is kept secure. Can be reset via User Management by Super Admin.
                    </div>
                  </div>
                )}

                <div className="modal-form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="course">Course / Program *</label>
                    <select
                      id="course"
                      value={formData.course}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                      required
                    >
                      {COURSE_PROGRAMS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="branch">Academic Branch / Department *</label>
                    <select
                      id="branch"
                      value={isCustomBranch ? 'OTHER' : formData.branch}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                      required={!isCustomBranch}
                    >
                      {(COURSE_BRANCH_MAP[formData.course] || []).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="OTHER">Other / Custom Branch...</option>
                    </select>

                    {isCustomBranch && (
                      <input
                        type="text"
                        placeholder="Type custom branch name"
                        value={formData.branch}
                        onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                        className="form-input"
                        style={{ width: '100%', height: '38px', marginTop: '6px', padding: '6px 10px' }}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="modal-form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="year">Current Year</label>
                    <select 
                      id="year" 
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', height: '42px', padding: '8px 12px' }}
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
                      style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Photo Upload input */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Profile Photo (Max 5MB)</label>
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
                        style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                      />
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>✓ Image ready for upload</span>
                    </div>
                  )}
                </div>

                {/* BED ASSIGNMENT FLOW: Only visible on Student Creation */}
                {modalMode === 'add' && (
                  <div className="modal-allocation-card">
                    <h3 className="modal-allocation-title">
                      🏢 Core Hostel Bed Assignment
                    </h3>
                    
                    <div className="modal-form-grid-2" style={{ marginBottom: '12px' }}>
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
                        <label className="form-label" style={{ fontSize: '12px' }}>Select Floor (Optional)</label>
                        <select 
                          value={formData.floor_id} 
                          onChange={(e) => handleFloorChange(e.target.value)}
                          disabled={!formData.hostel_id || floorsLoading}
                          className="form-input"
                          style={{ width: '100%', height: '40px', padding: '8px 12px' }}
                        >
                          <option value="">{floorsLoading ? 'Loading floors...' : floors.length === 0 ? '-- No Floors / Single Floor --' : '-- Choose Floor (Optional) --'}</option>
                          {floors.map(f => (
                            <option key={f.id} value={f.id}>{f.floor_name} (Floor {f.floor_number})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="modal-form-grid-2" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="custom-modal-footer">
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
        <div className="custom-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsTransferOpen(false); }}>
          <div className="custom-modal-container" style={{ maxWidth: '520px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-header-content">
                <h2 className="custom-modal-title">🔄 Transfer Student Bed</h2>
                <p className="custom-modal-subtitle">Allocate <strong>{selectedStudent.full_name}</strong> to a different bed vacancy.</p>
              </div>
              <button 
                onClick={() => setIsTransferOpen(false)}
                className="custom-modal-close-btn"
                aria-label="Close modal"
                title="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="custom-modal-body">
                {formErrors.form && (
                  <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">{formErrors.form}</span>
                  </div>
                )}

                <div style={{ marginBottom: '16px', fontSize: '13.5px', color: '#475569', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Current: <strong style={{ color: '#2563eb' }}>{selectedStudent.hostel_name || 'Unassigned'}</strong>
                  {selectedStudent.room_number ? ` (Room ${selectedStudent.room_number}, Bed ${selectedStudent.bed_number})` : ''}
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Destination Hostel *</label>
                  <select 
                    value={transferData.new_hostel_id} 
                    onChange={(e) => handleHostelChange(e.target.value, true)}
                    className="form-input"
                    style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                  >
                    <option value="">-- Choose Hostel --</option>
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Destination Floor (Optional)</label>
                  <select 
                    value={transferData.new_floor_id} 
                    onChange={(e) => handleFloorChange(e.target.value, true)}
                    disabled={!transferData.new_hostel_id || floorsLoading}
                    className="form-input"
                    style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                  >
                    <option value="">{floorsLoading ? 'Loading floors...' : floors.length === 0 ? '-- No Floors / Single Floor --' : '-- Choose Floor (Optional) --'}</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.floor_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Destination Room *</label>
                  <select 
                    value={transferData.new_room_id} 
                    onChange={(e) => handleRoomChange(e.target.value, true)}
                    disabled={!transferData.new_floor_id || roomsLoading}
                    className="form-input"
                    style={{ width: '100%', height: '42px', padding: '8px 12px' }}
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
                    style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                  >
                    <option value="">{bedsLoading ? 'Loading beds...' : '-- Choose Bed --'}</option>
                    {beds.filter(b => b.status === 'AVAILABLE').map(b => (
                      <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="custom-modal-footer">
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
        <div className="custom-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsStatusOpen(false); }}>
          <div className="custom-modal-container" style={{ maxWidth: '480px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-header-content">
                <h2 className="custom-modal-title">⚙️ Update Status / Deactivate</h2>
                <p className="custom-modal-subtitle">Alter the account status of <strong>{selectedStudent.full_name}</strong>.</p>
              </div>
              <button 
                onClick={() => setIsStatusOpen(false)}
                className="custom-modal-close-btn"
                aria-label="Close modal"
                title="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="custom-modal-body">
                {formErrors.form && (
                  <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">{formErrors.form}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="status-select">Select New Status *</label>
                  <select 
                    id="status-select" 
                    value={statusData.status}
                    onChange={(e) => setStatusData({ status: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', height: '42px', padding: '8px 12px' }}
                  >
                    <option value="ACTIVE">ACTIVE (Re-activate or Restore account)</option>
                    <option value="INACTIVE">INACTIVE (Deactivates access & releases assigned bed)</option>
                    <option value="GRADUATED">GRADUATED (Archive student & releases assigned bed)</option>
                  </select>
                </div>

                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  💡 <strong>Important Note:</strong> Switching a student to <code>INACTIVE</code> or <code>GRADUATED</code> will instantly release their currently assigned bed back to the availability pool.
                </div>
              </div>

              <div className="custom-modal-footer">
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
