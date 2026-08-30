import axios from 'axios';

// Get API base URL from Vite environment variables (safe for browser)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (for future authorization tokens)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (centralized error handling)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    const customError = {
      message: serverMessage || 'An error occurred while communicating with the server.',
      status: error.response?.status || 500,
      data: error.response?.data || null,
      response: error.response
    };
    
    // Log error for debugging
    console.error('API Error:', customError);
    
    return Promise.reject(customError);
  }
);

// Dashboard overview API method attached to api instance
api.getDashboardOverview = () => api.get('/dashboard/overview');

// Notice API methods
api.getNotices = (params = {}) => api.get('/notices', { params });
api.getUnreadCount = () => api.get('/notices/unread-count');
api.getNoticeById = (id) => api.get(`/notices/${id}`);
api.createNotice = (data) => api.post('/notices', data);
api.updateNotice = (id, data) => api.put(`/notices/${id}`, data);
api.updateNoticeStatus = (id, status) => api.patch(`/notices/${id}/status`, { status });
api.markNoticeRead = (id) => api.post(`/notices/${id}/read`);
api.deleteNotice = (id) => api.delete(`/notices/${id}`);

// Complaint API methods
api.getComplaints = (params = {}) => api.get('/complaints', { params });
api.getComplaintSummary = () => api.get('/complaints/summary');
api.getComplaintById = (id) => api.get(`/complaints/${id}`);
api.createComplaint = (data) => api.post('/complaints', data);
api.updateComplaintStatus = (id, status, comment = '', resolution = '') => api.patch(`/complaints/${id}/status`, { status, comment, resolution });
api.deleteComplaint = (id) => api.delete(`/complaints/${id}`);
api.assignComplaint = (id, assignedTo) => api.post(`/complaints/${id}/assign`, { assignedTo });
api.addComplaintComment = (id, comment, isInternal = false) => api.post(`/complaints/${id}/comments`, { comment, isInternal });

// Visitor API methods
api.getVisits = (params = {}) => api.get('/visitors', { params });
api.getVisitorSummary = () => api.get('/visitors/summary');
api.getCurrentVisitors = (params = {}) => api.get('/visitors/current', { params });
api.getVisitById = (id) => api.get(`/visitors/${id}`);
api.createVisit = (data) => api.post('/visitors', data);
api.approveVisit = (id, comment = '') => api.post(`/visitors/${id}/approve`, { comment });
api.rejectVisit = (id, comment = '') => api.post(`/visitors/${id}/reject`, { comment });
api.cancelVisit = (id, comment = '') => api.post(`/visitors/${id}/cancel`, { comment });
api.checkInVisit = (id, comment = '') => api.post(`/visitors/${id}/check-in`, { comment });
api.checkOutVisit = (id, comment = '') => api.post(`/visitors/${id}/check-out`, { comment });

// Mess & Food Management API methods
api.getMessMenus = (params = {}) => api.get('/mess/menu', { params });
api.getTodayMessMenu = (params = {}) => api.get('/mess/menu/today', { params });
api.getWeeklyMessMenu = (params = {}) => api.get('/mess/menu/weekly', { params });
api.createMessMenuItem = (data) => api.post('/mess/menu', data);
api.updateMessMenuItem = (id, data) => api.put(`/mess/menu/${id}`, data);
api.deleteMessMenuItem = (id) => api.delete(`/mess/menu/${id}`);

api.getMealParticipationRoster = (params = {}) => api.get('/mess/participation', { params });
api.getMyMealParticipation = (params = {}) => api.get('/mess/participation/me', { params });
api.setMealParticipation = (data) => api.post('/mess/participation', data);

api.getMessSummary = (params = {}) => api.get('/mess/summary', { params });
api.getMessAnalytics = (params = {}) => api.get('/mess/analytics', { params });

// Fee & Payment Management API methods
api.getFeeStructures = (params = {}) => api.get('/fees/structures', { params });
api.createFeeStructure = (data) => api.post('/fees/structures', data);
api.updateFeeStructure = (id, data) => api.put(`/fees/structures/${id}`, data);
api.toggleFeeStructureStatus = (id, is_active) => api.patch(`/fees/structures/${id}/status`, { is_active });

api.getStudentFees = (params = {}) => api.get('/fees', { params });
api.getMyFees = (params = {}) => api.get('/fees/me', { params });
api.getStudentFeeById = (id) => api.get(`/fees/${id}`);
api.assignStudentFee = (data) => api.post('/fees/assign', data);
api.waiveStudentFee = (id, waiver_reason) => api.patch(`/fees/${id}/waive`, { waiver_reason });

api.getPayments = (params = {}) => api.get('/fees/payments', { params });
api.recordPayment = (data) => api.post('/fees/payments', data);
api.getPaymentReceipt = (paymentId) => api.get(`/fees/receipts/${paymentId}`);

api.getFeeSummary = (params = {}) => api.get('/fees/summary', { params });

// Reports & Analytics Center API methods
api.getOverviewReport = (params = {}) => api.get('/reports/overview', { params });
api.getStudentReport = (params = {}) => api.get('/reports/students', { params });
api.getAttendanceReport = (params = {}) => api.get('/reports/attendance', { params });
api.getOccupancyReport = (params = {}) => api.get('/reports/occupancy', { params });
api.getComplaintReport = (params = {}) => api.get('/reports/complaints', { params });
api.getVisitorReport = (params = {}) => api.get('/reports/visitors', { params });
api.getMessReport = (params = {}) => api.get('/reports/mess', { params });
api.getFeeReport = (params = {}) => api.get('/reports/fees', { params });

// Student Allocations, Transfers & Checkout API methods
api.getAllocations = (params = {}) => api.get('/allocations', { params });
api.getAllocationById = (id) => api.get(`/allocations/${id}`);
api.getMyAllocation = () => api.get('/allocations/me');
api.getStudentAllocationHistory = (studentId) => api.get(`/allocations/student/${studentId}/history`);
api.getAvailableBeds = (hostel_id, room_id) => api.get('/allocations/available-beds', { params: { hostel_id, room_id } });
api.allocateStudent = (data) => api.post('/allocations', data);
api.transferStudent = (id, data) => api.post(`/allocations/${id}/transfer`, data);
api.checkoutStudent = (id, data) => api.post(`/allocations/${id}/checkout`, data);
api.getAllocationConsistency = () => api.get('/allocations/consistency');

// Student Management API methods
api.getStudents = (params = {}) => api.get('/students', { params });
api.getStudentById = (id) => api.get(`/students/${id}`);
api.createStudent = (data) => api.post('/students', data);
api.updateStudent = (id, data) => api.put(`/students/${id}`, data);
api.deactivateStudent = (id, status) => api.patch(`/students/${id}/deactivate`, { status });

// User Management & Security Hardening API methods
api.getUsers = (params = {}) => api.get('/users', { params });
api.getUserById = (id) => api.get(`/users/${id}`);
api.createUser = (data) => api.post('/users', data);
api.updateUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
api.updateUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });
api.adminResetPassword = (id, new_password) => api.post(`/users/${id}/reset-password`, { new_password });
api.updateSuperintendentHostels = (id, hostel_ids) => api.put(`/users/${id}/hostels`, { hostel_ids });
api.getMe = () => api.get('/auth/me');
api.changePassword = (data) => api.post('/auth/change-password', data);
api.updateSelfProfile = (data) => api.patch('/profile', data);
api.getAuditLogs = (params = {}) => api.get('/security/audit', { params });

// Phase 17 — Master Data & Data Integrity Center API methods
api.getMasterSummary = () => api.get('/master/summary');
api.getDataIntegrity = (params = {}) => api.get('/master/data-integrity', { params });
api.getDataIntegritySummary = () => api.get('/data-integrity/summary');
api.repairDataIntegrity = (issueType, targetId, repairAction) => api.post('/master/data-integrity/repair', { issueType, targetId, repairAction });

// Master Data Infrastructure CRUD methods
api.getHostels = (params = {}) => api.get('/hostels', { params });
api.createHostel = (data) => api.post('/hostels', data);
api.updateHostel = (id, data) => api.put(`/hostels/${id}`, data);
api.deleteHostel = (id) => api.delete(`/hostels/${id}`);

api.getFloors = (params = {}) => api.get('/floors', { params });
api.createFloor = (data) => api.post('/floors', data);
api.updateFloor = (id, data) => api.put(`/floors/${id}`, data);
api.deleteFloor = (id) => api.delete(`/floors/${id}`);

api.getRooms = (params = {}) => api.get('/rooms', { params });
api.createRoom = (data) => api.post('/rooms', data);
api.updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
api.deleteRoom = (id) => api.delete(`/rooms/${id}`);

api.getBeds = (params = {}) => api.get('/beds', { params });
api.createBed = (data) => api.post('/beds', data);
api.updateBed = (id, data) => api.put(`/beds/${id}`, data);
api.deleteBed = (id) => api.delete(`/beds/${id}`);

export default api;

