const mysql = require('mysql2/promise');
const env = require('./env');

// Seed Dataset for Mock fallback
const MOCK_ROLES = [
  { id: 1, name: 'SUPER_ADMIN' },
  { id: 2, name: 'SUPERINTENDENT' },
  { id: 3, name: 'STUDENT' }
];

const MOCK_HOSTELS = [
  { id: 1, name: 'Meridian Boys Hostel', code: 'MBH', gender: 'MALE', location: 'North Campus, Block A', status: 'ACTIVE' },
  { id: 2, name: 'Meridian Girls Hostel', code: 'MGH', gender: 'FEMALE', location: 'North Campus, Block B', status: 'ACTIVE' },
  { id: 3, name: 'BEC Boys Hostel', code: 'BBH', gender: 'MALE', location: 'West Campus, Sector 1', status: 'ACTIVE' },
  { id: 4, name: 'BEC Kara Hostel', code: 'BKH', gender: 'FEMALE', location: 'West Campus, Sector 2', status: 'ACTIVE' },
  { id: 5, name: 'Barmunda Boys Hostel', code: 'BMBH', gender: 'MALE', location: 'Barmunda Sub-campus', status: 'ACTIVE' },
  { id: 6, name: 'Barmunda Girls Hostel', code: 'BMGH', gender: 'FEMALE', location: 'Barmunda Sub-campus', status: 'ACTIVE' }
];

const MOCK_USERS = [
  { id: 1, role_id: 1, role: 'SUPER_ADMIN', username: 'superadmin', email: 'admin@hostel.com', password_hash: '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', status: 'ACTIVE' },
  { id: 2, role_id: 2, role: 'SUPERINTENDENT', username: 'warden', email: 'warden@hostel.com', password_hash: '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', status: 'ACTIVE' },
  { id: 3, role_id: 3, role: 'STUDENT', username: 'student', email: 'student@hostel.com', password_hash: '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', status: 'ACTIVE' },
  { id: 4, role_id: 3, role: 'STUDENT', username: 'student2', email: 'student2@hostel.com', password_hash: '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', status: 'ACTIVE' }
];

const MOCK_SUPER_HOSTELS = [
  { id: 1, user_id: 2, hostel_id: 1 },
  { id: 2, user_id: 2, hostel_id: 3 }
];

const MOCK_STUDENTS = [
  {
    id: 1,
    user_id: 3,
    hostel_id: 1,
    student_id: 'STD2026001',
    roll_number: 'CSE-2026-089',
    full_name: 'John Doe',
    phone: '9876543210',
    email: 'student@hostel.com',
    branch: 'Computer Science',
    course: 'B.Tech',
    year: 3,
    semester: 5,
    bed_id: 1,
    hostel_name: 'Meridian Boys Hostel',
    room_number: '101',
    bed_number: 'A-1',
    admission_date: '2024-07-15T00:00:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 2,
    user_id: 4,
    hostel_id: 1,
    student_id: 'STD2026002',
    roll_number: 'CSE-2026-090',
    full_name: 'Jane Smith',
    phone: '9876543211',
    email: 'student2@hostel.com',
    branch: 'Computer Science',
    course: 'B.Tech',
    year: 3,
    semester: 5,
    bed_id: 2,
    hostel_name: 'Meridian Boys Hostel',
    room_number: '102',
    bed_number: 'A-2',
    admission_date: '2024-07-15T00:00:00.000Z',
    status: 'ACTIVE'
  }
];

let MOCK_NOTICES = [
  {
    id: 1,
    title: 'Hostel Maintenance Schedule',
    description: 'Routine plumbing and electrical inspections will take place across all blocks this coming weekend. Please ensure your rooms are accessible.',
    created_by: 1,
    creator_name: 'superadmin',
    hostel_id: null,
    hostel_name: null,
    priority: 'IMPORTANT',
    status: 'PUBLISHED',
    published_at: new Date('2026-08-20T10:00:00Z').toISOString(),
    expires_at: new Date('2026-09-20T10:00:00Z').toISOString(),
    created_at: new Date('2026-08-20T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-20T10:00:00Z').toISOString()
  },
  {
    id: 2,
    title: 'Water Tank Cleaning Notice - Meridian Boys',
    description: 'The overhead water tank for Meridian Boys Hostel will undergo deep cleaning on Sunday between 8:00 AM and 1:00 PM. Water supply will be paused during this period.',
    created_by: 2,
    creator_name: 'warden',
    hostel_id: 1,
    hostel_name: 'Meridian Boys Hostel',
    priority: 'URGENT',
    status: 'PUBLISHED',
    published_at: new Date('2026-08-22T08:00:00Z').toISOString(),
    expires_at: new Date('2026-08-29T08:00:00Z').toISOString(),
    created_at: new Date('2026-08-22T07:30:00Z').toISOString(),
    updated_at: new Date('2026-08-22T08:00:00Z').toISOString()
  },
  {
    id: 3,
    title: 'Library Extension Hours Notice',
    description: 'The sub-campus study hall and library reading rooms will remain open until 11:00 PM during the mid-semester examination period.',
    created_by: 1,
    creator_name: 'superadmin',
    hostel_id: null,
    hostel_name: null,
    priority: 'GENERAL',
    status: 'PUBLISHED',
    published_at: new Date('2026-08-21T12:00:00Z').toISOString(),
    expires_at: new Date('2026-09-05T12:00:00Z').toISOString(),
    created_at: new Date('2026-08-21T11:00:00Z').toISOString(),
    updated_at: new Date('2026-08-21T12:00:00Z').toISOString()
  },
  {
    id: 4,
    title: 'Upcoming Hostel Sports Tournament Draft',
    description: 'Draft announcement for the annual Inter-Hostel Table Tennis and Carrom Championship.',
    created_by: 2,
    creator_name: 'warden',
    hostel_id: 1,
    hostel_name: 'Meridian Boys Hostel',
    priority: 'GENERAL',
    status: 'DRAFT',
    published_at: null,
    expires_at: null,
    created_at: new Date('2026-08-23T06:00:00Z').toISOString(),
    updated_at: new Date('2026-08-23T06:00:00Z').toISOString()
  }
];

let MOCK_NOTICE_READS = [];

let MOCK_COMPLAINTS = [
  {
    id: 1,
    student_id: 1,
    hostel_id: 1,
    category: 'PLUMBING',
    priority: 'HIGH',
    title: 'Bathroom Water Leakage in Room 101',
    description: 'Continuous water dripping from the sink tap creating a puddle near the door.',
    status: 'IN_PROGRESS',
    assigned_to: 2,
    resolution: null,
    resolved_at: null,
    closed_at: null,
    created_at: new Date('2026-08-22T08:00:00Z').toISOString(),
    updated_at: new Date('2026-08-22T09:00:00Z').toISOString()
  },
  {
    id: 2,
    student_id: 1,
    hostel_id: 1,
    category: 'ELECTRICITY',
    priority: 'URGENT',
    title: 'Study Light Socket Short Circuit',
    description: 'Power outlet sparking when plugging in laptop charger. Needs urgent repair.',
    status: 'OPEN',
    assigned_to: null,
    resolution: null,
    resolved_at: null,
    closed_at: null,
    created_at: new Date('2026-08-23T06:00:00Z').toISOString(),
    updated_at: new Date('2026-08-23T06:00:00Z').toISOString()
  },
  {
    id: 3,
    student_id: 1,
    hostel_id: 1,
    category: 'FAN_AC',
    priority: 'MEDIUM',
    title: 'Ceiling Fan Making Loud Noise',
    description: 'Ceiling fan wobble and squeaking sound at high speed setting.',
    status: 'RESOLVED',
    assigned_to: 2,
    resolution: 'Tightened fan mounting brackets and lubricated motor bearing.',
    resolved_at: new Date('2026-08-23T11:00:00Z').toISOString(),
    closed_at: null,
    created_at: new Date('2026-08-21T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-23T11:00:00Z').toISOString()
  }
];

let MOCK_COMPLAINT_HISTORY = [
  { id: 1, complaint_id: 1, changed_by: 3, old_status: null, new_status: 'OPEN', comment: 'Complaint submitted by student.', created_at: new Date('2026-08-22T08:00:00Z').toISOString() },
  { id: 2, complaint_id: 1, changed_by: 2, old_status: 'OPEN', new_status: 'IN_PROGRESS', comment: 'Maintenance warden assigned plumbing team.', created_at: new Date('2026-08-22T09:00:00Z').toISOString() },
  { id: 3, complaint_id: 3, changed_by: 3, old_status: null, new_status: 'OPEN', comment: 'Complaint submitted by student.', created_at: new Date('2026-08-21T09:00:00Z').toISOString() },
  { id: 4, complaint_id: 3, changed_by: 2, old_status: 'OPEN', new_status: 'IN_PROGRESS', comment: 'Assigned electrician.', created_at: new Date('2026-08-22T10:00:00Z').toISOString() },
  { id: 5, complaint_id: 3, changed_by: 2, old_status: 'IN_PROGRESS', new_status: 'RESOLVED', comment: 'Tightened fan mounting brackets and lubricated motor bearing.', created_at: new Date('2026-08-23T11:00:00Z').toISOString() }
];

let MOCK_COMPLAINT_COMMENTS = [
  { id: 1, complaint_id: 1, user_id: 3, comment: 'Dripping has increased since morning.', is_internal: 0, created_at: new Date('2026-08-22T08:30:00Z').toISOString() }
];

let MOCK_VISITS = [
  {
    id: 1,
    student_id: 1,
    hostel_id: 1,
    room_id: 1,
    bed_id: 1,
    visitor_name: 'Robert Doe',
    visitor_phone: '9876543210',
    visitor_email: 'robert.doe@example.com',
    visitor_type: 'PARENT',
    purpose: 'Delivering personal belongings and books.',
    identification_type: 'Aadhaar',
    identification_last4: '4321',
    visit_date: new Date().toISOString().split('T')[0],
    expected_check_in: new Date(Date.now() - 3600000).toISOString(),
    expected_check_out: new Date(Date.now() + 14400000).toISOString(),
    actual_check_in: new Date(Date.now() - 3000000).toISOString(),
    actual_check_out: null,
    status: 'CHECKED_IN',
    created_by: 3,
    approved_by: 2,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: 2,
    student_id: 1,
    hostel_id: 1,
    room_id: 1,
    bed_id: 1,
    visitor_name: 'Michael Smith',
    visitor_phone: '9123456789',
    visitor_email: 'michael.s@example.com',
    visitor_type: 'RELATIVE',
    purpose: 'Family weekend visit.',
    identification_type: 'Voter ID',
    identification_last4: '8765',
    visit_date: new Date().toISOString().split('T')[0],
    expected_check_in: new Date(Date.now() + 3600000).toISOString(),
    expected_check_out: new Date(Date.now() + 10800000).toISOString(),
    actual_check_in: null,
    actual_check_out: null,
    status: 'APPROVED',
    created_by: 3,
    approved_by: 2,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  }
];

let MOCK_VISITOR_HISTORY = [
  { id: 1, visit_id: 1, changed_by: 3, old_status: null, new_status: 'REQUESTED', comment: 'Visitor request submitted by student.', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, visit_id: 1, changed_by: 2, old_status: 'REQUESTED', new_status: 'APPROVED', comment: 'Approved by warden.', created_at: new Date(Date.now() - 5400000).toISOString() },
  { id: 3, visit_id: 1, changed_by: 2, old_status: 'APPROVED', new_status: 'CHECKED_IN', comment: 'Visitor checked in at main gate.', created_at: new Date(Date.now() - 3000000).toISOString() }
];

let MOCK_MESS_MENUS = [
  { id: 1, hostel_id: 1, menu_date: new Date().toISOString().split('T')[0], meal_type: 'BREAKFAST', meal_name: 'Idli, Sambar & Coconut Chutney', description: 'Freshly steamed rice idlis with hot sambar', is_available: 1, created_by: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, hostel_id: 1, menu_date: new Date().toISOString().split('T')[0], meal_type: 'LUNCH', meal_name: 'Steamed Rice, Dal Tadka, Mix Veg & Curd', description: 'Balanced thali with seasonal vegetables', is_available: 1, created_by: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, hostel_id: 1, menu_date: new Date().toISOString().split('T')[0], meal_type: 'SNACKS', meal_name: 'Masala Tea & Veg Cutlets', description: 'Evening refreshment', is_available: 1, created_by: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, hostel_id: 1, menu_date: new Date().toISOString().split('T')[0], meal_type: 'DINNER', meal_name: 'Butter Roti, Paneer Butter Masala & Jeera Rice', description: 'Rich dinner spread with dessert', is_available: 1, created_by: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let MOCK_MEAL_ATTENDANCE = [
  { id: 1, student_id: 1, hostel_id: 1, meal_date: new Date().toISOString().split('T')[0], meal_type: 'BREAKFAST', status: 'TAKING', marked_at: new Date().toISOString() },
  { id: 2, student_id: 1, hostel_id: 1, meal_date: new Date().toISOString().split('T')[0], meal_type: 'LUNCH', status: 'TAKING', marked_at: new Date().toISOString() },
  { id: 3, student_id: 1, hostel_id: 1, meal_date: new Date().toISOString().split('T')[0], meal_type: 'SNACKS', status: 'NOT_TAKING', marked_at: new Date().toISOString() },
  { id: 4, student_id: 1, hostel_id: 1, meal_date: new Date().toISOString().split('T')[0], meal_type: 'DINNER', status: 'TAKING', marked_at: new Date().toISOString() }
];

let MOCK_FEE_STRUCTURES = [
  { id: 1, hostel_id: 1, fee_type: 'HOSTEL_FEE', name: 'Annual Hostel Accommodation Fee 2026-27', description: 'Standard room rent and facilities for academic year 2026-27', amount: 30000.00, frequency: 'YEARLY', academic_year: '2026-27', applicable_course: 'B.Tech', applicable_branch: null, applicable_year: null, is_active: 1, created_by: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, hostel_id: 1, fee_type: 'MESS_FEE', name: 'Semester Mess Charges 2026-27', description: 'Four daily meals coverage for semester 5', amount: 15000.00, frequency: 'SEMESTER', academic_year: '2026-27', applicable_course: null, applicable_branch: null, applicable_year: null, is_active: 1, created_by: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, hostel_id: null, fee_type: 'SECURITY_DEPOSIT', name: 'One-Time Hostel Security Deposit', description: 'Refundable security deposit at admission', amount: 5000.00, frequency: 'ONE_TIME', academic_year: '2026-27', applicable_course: null, applicable_branch: null, applicable_year: null, is_active: 1, created_by: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let MOCK_STUDENT_FEES = [
  { id: 1, student_id: 1, hostel_id: 1, fee_structure_id: 1, academic_year: '2026-27', amount: 30000.00, paid_amount: 10000.00, due_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0], status: 'PARTIAL', waiver_reason: null, waived_by: null, waived_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, student_id: 1, hostel_id: 1, fee_structure_id: 2, academic_year: '2026-27', amount: 15000.00, paid_amount: 15000.00, due_date: new Date(Date.now() - 10*86400000).toISOString().split('T')[0], status: 'PAID', waiver_reason: null, waived_by: null, waived_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, student_id: 2, hostel_id: 1, fee_structure_id: 1, academic_year: '2026-27', amount: 30000.00, paid_amount: 0.00, due_date: new Date(Date.now() - 5*86400000).toISOString().split('T')[0], status: 'OVERDUE', waiver_reason: null, waived_by: null, waived_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let MOCK_FEE_PAYMENTS = [
  { id: 1, student_fee_id: 1, student_id: 1, hostel_id: 1, amount: 10000.00, payment_method: 'UPI', receipt_number: 'FEE-2026-000001', transaction_reference: 'UPI1234567890', payment_date: new Date().toISOString().split('T')[0], received_by: 2, notes: 'First installment paid via UPI', created_at: new Date().toISOString() },
  { id: 2, student_fee_id: 2, student_id: 1, hostel_id: 1, amount: 15000.00, payment_method: 'BANK_TRANSFER', receipt_number: 'FEE-2026-000002', transaction_reference: 'NFT9876543210', payment_date: new Date().toISOString().split('T')[0], received_by: 2, notes: 'Full semester mess fee', created_at: new Date().toISOString() }
];

let MOCK_FEE_HISTORY = [
  { id: 1, student_fee_id: 1, changed_by: 1, action: 'ASSIGNED', old_value: null, new_value: '30000.00', reason: 'Fee assigned to student', created_at: new Date().toISOString() },
  { id: 2, student_fee_id: 1, changed_by: 2, action: 'PAYMENT_RECORDED', old_value: 'Paid: ₹0.00, Status: PENDING', new_value: 'Paid: ₹10000.00, Status: PARTIAL', reason: 'Payment of ₹10000.00 recorded via UPI. Receipt: FEE-2026-000001', created_at: new Date().toISOString() }
];

let MOCK_STUDENT_ALLOCATIONS = [
  { id: 1, student_id: 1, hostel_id: 1, room_id: 1, bed_id: 1, allocated_from: '2026-08-01', allocated_until: null, status: 'ACTIVE', allocated_by: 1, checkout_reason: null, transfer_reason: null, custom_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, student_id: 2, hostel_id: 1, room_id: 1, bed_id: 2, allocated_from: '2026-08-01', allocated_until: null, status: 'ACTIVE', allocated_by: 1, checkout_reason: null, transfer_reason: null, custom_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let isOffline = false;

// Initialize the actual MySQL connection pool
const realPool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// A lightweight Mock Query Parser simulating SQL database operations
const mockQuery = async (sql, params = []) => {
  const queryLower = sql.toLowerCase();
  if (queryLower.includes('visits')) {
    // console.log('MOCK_VISITS QUERY:', sql, params);
  }

  // 1. SELECT users u JOIN roles r (check active user profile)
  if (queryLower.includes('from users') && (queryLower.includes('u.id = ?') || queryLower.includes('id = ?'))) {
    const id = params[0];
    const user = MOCK_USERS.find(u => u.id === Number(id));
    return user ? [[user]] : [[]];
  }

  // 2. SELECT users u JOIN roles r (credential search during login)
  if (queryLower.includes('from users u') && queryLower.includes('u.username = ? or u.email = ?')) {
    const identifier = params[0];
    const user = MOCK_USERS.find(u => u.username === identifier || u.email === identifier);
    return user ? [[user]] : [[]];
  }

  // 3. SELECT superintendent_hostels (assigned hostels check)
  if (queryLower.includes('from superintendent_hostels') && queryLower.includes('user_id = ?')) {
    const userId = params[0];
    const assigned = MOCK_SUPER_HOSTELS.filter(sh => sh.user_id === Number(userId));
    return [assigned];
  }

  // 4. SELECT students belongs check (ownership check)
  if (queryLower.includes('from students') && queryLower.includes('user_id = ? and id = ?')) {
    const userId = params[0];
    const studentId = params[1];
    const student = MOCK_STUDENTS.find(s => s.user_id === Number(userId) && s.id === Number(studentId));
    return student ? [[{ id: student.id }]] : [[]];
  }

  // 5. SELECT student by ID or User ID (profile fetch)
  if (queryLower.includes('from students') && queryLower.includes('user_id = ?')) {
    const userId = params[0];
    const student = MOCK_STUDENTS.find(s => s.user_id === Number(userId));
    return student ? [[student]] : [[]];
  }
  
  if (queryLower.includes('from students') && queryLower.includes('id = ?') && !queryLower.includes('from visits') && !queryLower.includes('from meal_attendance')) {
    const studentId = params[0];
    const student = MOCK_STUDENTS.find(s => s.id === Number(studentId));
    return student ? [[student]] : [[]];
  }

  // 6. SELECT hostels dynamic listings based on role
  if (queryLower.includes('from hostels') && queryLower.includes('superintendent_hostels sh')) {
    // Superintendent query: gets only assigned hostels 1 and 3
    const userId = params[0];
    const assignedIds = MOCK_SUPER_HOSTELS.filter(sh => sh.user_id === Number(userId)).map(sh => sh.hostel_id);
    const assignedHostels = MOCK_HOSTELS.filter(h => assignedIds.includes(h.id));
    return [assignedHostels];
  }

  if (queryLower.includes('from hostels') && queryLower.includes('rooms r') && queryLower.includes('students s')) {
    // Student query: gets only the student's assigned hostel (hostel id 1)
    const userId = params[0];
    const student = MOCK_STUDENTS.find(s => s.user_id === Number(userId));
    if (student) {
      // Find room -> hostel
      const hostel = MOCK_HOSTELS.find(h => h.id === 1);
      return hostel ? [[hostel]] : [[]];
    }
    return [[]];
  }

  if (queryLower.includes('from hostels') && queryLower.includes('order by id asc')) {
    // Admin query: returns all 6 hostels
    return [MOCK_HOSTELS];
  }

  // ── MOCK NOTICES OPERATIONS ──────────────────────────────────────────────
  // 7. INSERT INTO notice_reads
  if (queryLower.includes('into notice_reads')) {
    const [notice_id, user_id] = params;
    const existing = MOCK_NOTICE_READS.find(nr => nr.notice_id === Number(notice_id) && nr.user_id === Number(user_id));
    if (!existing) {
      MOCK_NOTICE_READS.push({
        id: MOCK_NOTICE_READS.length + 1,
        notice_id: Number(notice_id),
        user_id: Number(user_id),
        read_at: new Date().toISOString()
      });
    } else {
      existing.read_at = new Date().toISOString();
    }
    return [{ insertId: MOCK_NOTICE_READS.length, affectedRows: 1 }];
  }

  // 8. INSERT INTO notices
  if (queryLower.includes('into notices')) {
    // Params: [title, description, created_by, hostel_id, priority, status, published_at, expires_at]
    const [title, description, created_by, hostel_id, priority, status, published_at, expires_at] = params;
    const creator = MOCK_USERS.find(u => u.id === Number(created_by));
    const hostel = hostel_id ? MOCK_HOSTELS.find(h => h.id === Number(hostel_id)) : null;
    const newNotice = {
      id: MOCK_NOTICES.length + 1,
      title,
      description,
      created_by: Number(created_by),
      creator_name: creator ? creator.username : 'User',
      hostel_id: hostel_id ? Number(hostel_id) : null,
      hostel_name: hostel ? hostel.name : null,
      priority: priority || 'GENERAL',
      status: status || 'DRAFT',
      published_at: published_at || (status === 'PUBLISHED' ? new Date().toISOString() : null),
      expires_at: expires_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_NOTICES.push(newNotice);
    return [{ insertId: newNotice.id, affectedRows: 1 }];
  }

  // 9. UPDATE notices
  if (queryLower.includes('update notices')) {
    if (queryLower.includes('set status =')) {
      // Status update: status, [published_at], id
      const id = params[params.length - 1];
      const notice = MOCK_NOTICES.find(n => n.id === Number(id));
      if (notice) {
        notice.status = params[0];
        if (params.length > 2) notice.published_at = params[1];
        notice.updated_at = new Date().toISOString();
      }
      return [{ affectedRows: notice ? 1 : 0 }];
    }
    // Full update
    const id = params[params.length - 1];
    const notice = MOCK_NOTICES.find(n => n.id === Number(id));
    if (notice) {
      notice.title = params[0];
      notice.description = params[1];
      notice.hostel_id = params[2] ? Number(params[2]) : null;
      notice.priority = params[3];
      notice.status = params[4];
      notice.published_at = params[5];
      notice.expires_at = params[6];
      notice.updated_at = new Date().toISOString();

      const hostel = notice.hostel_id ? MOCK_HOSTELS.find(h => h.id === notice.hostel_id) : null;
      notice.hostel_name = hostel ? hostel.name : null;
    }
    return [{ affectedRows: notice ? 1 : 0 }];
  }

  // 10. DELETE FROM notices
  if (queryLower.includes('delete from notices')) {
    const id = params[0];
    const index = MOCK_NOTICES.findIndex(n => n.id === Number(id));
    if (index !== -1) {
      MOCK_NOTICES.splice(index, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 11. SELECT FROM notices (single or list or count)
  if (queryLower.includes('from notices')) {
    let result = [...MOCK_NOTICES];

    // Single notice ID query: WHERE n.id = ?
    if (queryLower.includes('where n.id = ?') || queryLower.includes('n.id = ?')) {
      const targetId = Number(params[params.length - 1] || params[1] || params[0]);
      result = result.filter(n => n.id === targetId);
    } else {
      // Status filter
      if (queryLower.includes("n.status = 'published'") || queryLower.includes("n.status = ?")) {
        const reqStatus = queryLower.includes("n.status = ?")
          ? params.find(p => typeof p === 'string' && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(p.toUpperCase()))
          : 'PUBLISHED';
        if (reqStatus) {
          result = result.filter(n => n.status === (reqStatus.toUpperCase ? reqStatus.toUpperCase() : reqStatus));
        } else if (queryLower.includes("n.status = 'published'")) {
          result = result.filter(n => n.status === 'PUBLISHED');
        }
      }

      // Expiration filter: expires_at > NOW()
      if (queryLower.includes('expires_at > now()') || queryLower.includes('n.expires_at > now()')) {
        result = result.filter(n => !n.expires_at || new Date(n.expires_at) > new Date());
      }

      // Read filter: nr.id IS NULL (unread)
      if (queryLower.includes('nr.id is null')) {
        const userId = Number(params[0]);
        result = result.filter(n => !MOCK_NOTICE_READS.some(nr => nr.notice_id === n.id && nr.user_id === userId));
      }

      // Hostel filter for student / superintendent
      if (queryLower.includes('n.hostel_id is null or n.hostel_id = ?')) {
        const hostelId = params.find(p => typeof p === 'number');
        if (hostelId !== undefined) {
          result = result.filter(n => n.hostel_id === null || n.hostel_id === Number(hostelId));
        }
      } else if (queryLower.includes('n.hostel_id is null')) {
        result = result.filter(n => n.hostel_id === null);
      }
    }

    // Enrich with is_read and creator_name
    const userId = Number(params[0] || 0);
    result = result.map(n => {
      const hostel = n.hostel_id ? MOCK_HOSTELS.find(h => h.id === n.hostel_id) : null;
      const creator = MOCK_USERS.find(u => u.id === n.created_by);
      const isRead = MOCK_NOTICE_READS.some(nr => nr.notice_id === n.id && nr.user_id === userId);
      return {
        ...n,
        hostel_name: hostel ? hostel.name : null,
        creator_name: creator ? creator.username : 'Admin',
        is_read: isRead ? 1 : 0
      };
    });

    if (queryLower.includes('count(')) {
      return [[{ total: result.length, count: result.length, unreadCount: result.length }]];
    }

    return [result];
  }

  // ── MOCK COMPLAINTS OPERATIONS ───────────────────────────────────────────
  // 12. INSERT INTO complaints
  if (queryLower.includes('into complaints')) {
    const [student_id, hostel_id, category, priority, title, description] = params;
    const newComp = {
      id: MOCK_COMPLAINTS.length + 1,
      student_id: Number(student_id),
      hostel_id: Number(hostel_id),
      category: category || 'ROOM',
      priority: priority || 'MEDIUM',
      title,
      description,
      status: 'OPEN',
      assigned_to: null,
      resolution: null,
      resolved_at: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_COMPLAINTS.push(newComp);
    return [{ insertId: newComp.id, affectedRows: 1 }];
  }

  // 13. INSERT INTO complaint_history
  if (queryLower.includes('into complaint_history')) {
    const [complaint_id, changed_by, old_status, new_status, comment] = params;
    const newHist = {
      id: MOCK_COMPLAINT_HISTORY.length + 1,
      complaint_id: Number(complaint_id),
      changed_by: Number(changed_by),
      old_status: old_status || null,
      new_status: new_status || null,
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    MOCK_COMPLAINT_HISTORY.push(newHist);
    return [{ insertId: newHist.id, affectedRows: 1 }];
  }

  // 14. INSERT INTO complaint_comments
  if (queryLower.includes('into complaint_comments')) {
    const [complaint_id, user_id, comment, is_internal] = params;
    const newComm = {
      id: MOCK_COMPLAINT_COMMENTS.length + 1,
      complaint_id: Number(complaint_id),
      user_id: Number(user_id),
      comment,
      is_internal: is_internal ? 1 : 0,
      created_at: new Date().toISOString()
    };
    MOCK_COMPLAINT_COMMENTS.push(newComm);
    return [{ insertId: newComm.id, affectedRows: 1 }];
  }

  // 15. UPDATE complaints
  if (queryLower.includes('update complaints')) {
    if (queryLower.includes('set assigned_to =')) {
      const assignedTo = params[0];
      const id = params[1];
      const comp = MOCK_COMPLAINTS.find(c => c.id === Number(id));
      if (comp) {
        comp.assigned_to = assignedTo ? Number(assignedTo) : null;
        if (comp.status === 'OPEN') comp.status = 'IN_PROGRESS';
        comp.updated_at = new Date().toISOString();
      }
      return [{ affectedRows: comp ? 1 : 0 }];
    }

    if (queryLower.includes('set status =')) {
      const targetStatus = params[0];
      let id = params[params.length - 1];
      const comp = MOCK_COMPLAINTS.find(c => c.id === Number(id));
      if (comp) {
        comp.status = targetStatus;
        if (targetStatus === 'RESOLVED') {
          comp.resolution = params[1];
          comp.resolved_at = new Date().toISOString();
        } else if (targetStatus === 'CLOSED') {
          comp.closed_at = new Date().toISOString();
        }
        comp.updated_at = new Date().toISOString();
      }
      return [{ affectedRows: comp ? 1 : 0 }];
    }
  }

  // 16. SELECT FROM complaint_history
  if (queryLower.includes('from complaint_history')) {
    const complaintId = Number(params[0]);
    const history = MOCK_COMPLAINT_HISTORY
      .filter(ch => ch.complaint_id === complaintId)
      .map(ch => {
        const u = MOCK_USERS.find(user => user.id === ch.changed_by);
        return {
          ...ch,
          changed_by_name: u ? u.username : 'User',
          changed_by_role: u ? u.role : 'USER'
        };
      });
    return [history];
  }

  // 17. SELECT FROM complaint_comments
  if (queryLower.includes('from complaint_comments')) {
    const complaintId = Number(params[0]);
    let comments = MOCK_COMPLAINT_COMMENTS.filter(cc => cc.complaint_id === complaintId);
    if (queryLower.includes('cc.is_internal = 0')) {
      comments = comments.filter(cc => cc.is_internal === 0);
    }
    comments = comments.map(cc => {
      const u = MOCK_USERS.find(user => user.id === cc.user_id);
      return {
        ...cc,
        author_name: u ? u.username : 'User',
        author_role: u ? u.role : 'USER'
      };
    });
    return [comments];
  }

  if (queryLower.includes('show columns from complaints')) {
    return [[{ Field: 'category', Type: "enum('ROOM','ELECTRICITY','WATER','PLUMBING','CLEANLINESS','FAN_AC','FURNITURE','FOOD_MESS','INTERNET','SECURITY','MAINTENANCE','OTHER')" }]];
  }

  // 18. SELECT FROM complaints (summary / count / list)
  if (queryLower.includes('from complaints')) {
    let result = [...MOCK_COMPLAINTS];

    // Check summary aggregation query
    if (queryLower.includes('sum(status =')) {
      const studentIdFilter = params[0];
      if (queryLower.includes('where student_id = ?')) {
        result = result.filter(c => c.student_id === Number(studentIdFilter));
      } else if (queryLower.includes('where hostel_id in')) {
        const hostelIds = params.map(p => Number(p));
        result = result.filter(c => hostelIds.includes(c.hostel_id));
      }
      const openCount = result.filter(c => c.status === 'OPEN').length;
      const inProgressCount = result.filter(c => c.status === 'IN_PROGRESS').length;
      const resolvedCount = result.filter(c => c.status === 'RESOLVED').length;
      const urgentCount = result.filter(c => c.priority === 'URGENT' && ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(c.status)).length;
      return [[{
        openCount,
        inProgressCount,
        resolvedCount,
        urgentCount,
        totalCount: result.length
      }]];
    }

    // Filter by student_id
    if (queryLower.includes('c.student_id = ?') || queryLower.includes('student_id = ?')) {
      const sId = params.find(p => typeof p === 'number');
      if (sId !== undefined) {
        result = result.filter(c => c.student_id === Number(sId));
      }
    }

    // Filter by hostel_id IN (...)
    if (queryLower.includes('c.hostel_id in')) {
      const hostelIds = params.filter(p => typeof p === 'number');
      if (hostelIds.length > 0) {
        result = result.filter(c => hostelIds.includes(c.hostel_id));
      }
    }

    // Filter by status
    if (queryLower.includes('c.status = ?')) {
      const st = params.find(p => typeof p === 'string' && VALID_STATUSES.includes(p.toUpperCase()));
      if (st) {
        result = result.filter(c => c.status === st.toUpperCase());
      }
    }

    // Filter by category
    if (queryLower.includes('c.category = ?')) {
      const cat = params.find(p => typeof p === 'string' && VALID_CATEGORIES.includes(p.toUpperCase()));
      if (cat) {
        result = result.filter(c => c.category === cat.toUpperCase());
      }
    }

    // Filter by priority
    if (queryLower.includes('c.priority = ?')) {
      const prio = params.find(p => typeof p === 'string' && VALID_PRIORITIES.includes(p.toUpperCase()));
      if (prio) {
        result = result.filter(c => c.priority === prio.toUpperCase());
      }
    }

    // Single complaint query: WHERE c.id = ?
    if (queryLower.includes('c.id = ?')) {
      const compId = Number(params[0]);
      result = result.filter(c => c.id === compId);
    }

    if (queryLower.includes('count(')) {
      return [[{ total: result.length, count: result.length }]];
    }

    // Map fields
    result = result.map(c => {
      const st = MOCK_STUDENTS.find(s => s.id === c.student_id) || MOCK_STUDENTS[0];
      const h = MOCK_HOSTELS.find(hostel => hostel.id === c.hostel_id) || MOCK_HOSTELS[0];
      const u = c.assigned_to ? MOCK_USERS.find(user => user.id === c.assigned_to) : null;
      return {
        ...c,
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        hostel_name: h ? h.name : 'Meridian Boys Hostel',
        room_number: st ? st.room_number : '101',
        bed_number: st ? st.bed_number : 'A-1',
        assigned_to_name: u ? u.username : null
      };
    });

    return [result];
  }

  // 19. INSERT INTO visits
  if (queryLower.includes('insert into visits')) {
    const newId = MOCK_VISITS.length + 1;
    const newVisit = {
      id: newId,
      student_id: Number(params[0]),
      hostel_id: Number(params[1]),
      room_id: params[2] ? Number(params[2]) : null,
      bed_id: params[3] ? Number(params[3]) : null,
      visitor_name: params[4],
      visitor_phone: params[5],
      visitor_email: params[6] || null,
      visitor_type: params[7],
      purpose: params[8],
      identification_type: params[9] || 'Aadhaar',
      identification_last4: params[10],
      visit_date: params[11],
      expected_check_in: params[12],
      expected_check_out: params[13],
      actual_check_in: null,
      actual_check_out: null,
      status: params[14] || 'REQUESTED',
      created_by: Number(params[15]),
      approved_by: params[16] ? Number(params[16]) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_VISITS.push(newVisit);
    return [{ insertId: newId }];
  }

  // 20. INSERT INTO visitor_history
  if (queryLower.includes('insert into visitor_history')) {
    const newId = MOCK_VISITOR_HISTORY.length + 1;
    MOCK_VISITOR_HISTORY.push({
      id: newId,
      visit_id: Number(params[0]),
      changed_by: Number(params[1]),
      old_status: params[2] || null,
      new_status: params[3],
      comment: params[4] || null,
      created_at: new Date().toISOString()
    });
    return [{ insertId: newId }];
  }

  // 21. UPDATE visits
  if (queryLower.includes('update visits')) {
    let visitId;
    if (queryLower.includes('where id = ?')) {
      visitId = Number(params[params.length - 1]);
    }
    const visit = MOCK_VISITS.find(v => v.id === visitId);
    if (visit) {
      if (queryLower.includes("status = 'approved'")) {
        visit.status = 'APPROVED';
        if (queryLower.includes('approved_by = ?')) {
          visit.approved_by = Number(params[0]);
        }
      } else if (queryLower.includes("status = 'rejected'")) {
        visit.status = 'REJECTED';
      } else if (queryLower.includes("status = 'cancelled'")) {
        visit.status = 'CANCELLED';
      } else if (queryLower.includes("status = 'checked_in'")) {
        visit.status = 'CHECKED_IN';
        visit.actual_check_in = new Date().toISOString();
      } else if (queryLower.includes("status = 'checked_out'")) {
        visit.status = 'CHECKED_OUT';
        visit.actual_check_out = new Date().toISOString();
      }
      visit.updated_at = new Date().toISOString();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 22. SELECT FROM visitor_history
  if (queryLower.includes('from visitor_history')) {
    const visitId = Number(params[0]);
    const history = MOCK_VISITOR_HISTORY
      .filter(vh => vh.visit_id === visitId)
      .map(vh => {
        const u = MOCK_USERS.find(user => user.id === vh.changed_by);
        return {
          ...vh,
          changed_by_name: u ? u.username : 'User',
          changed_by_role: u ? u.role : 'USER'
        };
      });
    return [history];
  }

  // 23. SELECT FROM visits v
  if (queryLower.includes('from visits v') || queryLower.includes('from visits')) {
    let result = [...MOCK_VISITS];
    // console.log('DEBUG MOCK VISITS COUNT:', MOCK_VISITS.length, 'params:', params);

    // Summary counts query
    if (queryLower.includes('sum(case when v.status')) {
      if (queryLower.includes('where v.student_id = ?')) {
        result = result.filter(v => v.student_id === Number(params[0]));
      } else if (queryLower.includes('where v.hostel_id in')) {
        const hostelIds = params.map(p => Number(p));
        result = result.filter(v => hostelIds.includes(v.hostel_id));
      }

      const current_visitors = result.filter(v => v.status === 'CHECKED_IN').length;
      const overdue_visitors = result.filter(v => v.status === 'CHECKED_IN' && new Date(v.expected_check_out) < new Date()).length;
      const today_visits = result.filter(v => v.visit_date === new Date().toISOString().split('T')[0]).length;
      const pending_requests = result.filter(v => v.status === 'REQUESTED').length;

      return [[{
        current_visitors,
        overdue_visitors,
        today_visits,
        pending_requests,
        total_visits: result.length
      }]];
    }

    // Filter by student_id
    if (queryLower.includes('where v.student_id = ?') || queryLower.includes('and v.student_id = ?')) {
      const sId = params.find(p => typeof p === 'number');
      if (sId !== undefined) {
        result = result.filter(v => v.student_id === Number(sId));
      }
    }

    // Filter by hostel_id IN (...)
    if (queryLower.includes('v.hostel_id in')) {
      const hostelIds = params.filter(p => typeof p === 'number');
      if (hostelIds.length > 0) {
        result = result.filter(v => hostelIds.includes(v.hostel_id));
      }
    } else if (queryLower.includes('where v.hostel_id = ?') || queryLower.includes('and v.hostel_id = ?')) {
      const hId = params.find(p => typeof p === 'number');
      if (hId !== undefined) {
        result = result.filter(v => v.hostel_id === Number(hId));
      }
    }

    // Filter by status
    if (queryLower.includes('where v.status = ?') || queryLower.includes('and v.status = ?')) {
      const st = params.find(p => typeof p === 'string' && ['REQUESTED', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REJECTED'].includes(p.toUpperCase()));
      if (st) {
        result = result.filter(v => v.status === st.toUpperCase());
      }
    }

    // Filter by is_current
    if (queryLower.includes("where v.status = 'checked_in'") || queryLower.includes("and v.status = 'checked_in'")) {
      result = result.filter(v => v.status === 'CHECKED_IN');
    }

    // Filter by single visit ID
    if (queryLower.includes('where v.id = ?')) {
      const vId = Number(params[params.length - 1]);
      result = result.filter(v => v.id === vId);
    }

    if (queryLower.includes('count(*) as total')) {
      return [[{ total: result.length }]];
    }

    result = result.map(v => {
      const st = MOCK_STUDENTS.find(s => s.id === v.student_id) || MOCK_STUDENTS[0];
      const h = MOCK_HOSTELS.find(hostel => hostel.id === v.hostel_id) || MOCK_HOSTELS[0];
      const cb = MOCK_USERS.find(user => user.id === v.created_by);
      const ab = v.approved_by ? MOCK_USERS.find(user => user.id === v.approved_by) : null;

      return {
        ...v,
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        student_phone: st ? st.phone : '9876543210',
        student_branch: st ? st.branch : 'CSE',
        student_year: st ? st.year : 3,
        hostel_name: h ? h.name : 'Meridian Boys Hostel',
        room_number: st ? st.room_number : '101',
        bed_number: st ? st.bed_number : 'A-1',
        creator_name: cb ? cb.username : 'User',
        creator_role: cb ? cb.role : 'STUDENT',
        approver_name: ab ? ab.username : null,
        is_overdue: (v.status === 'CHECKED_IN' && new Date(v.expected_check_out) < new Date()) ? 1 : 0
      };
    });

    return [result];
  }

  // --- MESS MENUS QUERIES ---
  if (queryLower.includes('insert into mess_menus')) {
    const newId = MOCK_MESS_MENUS.length > 0 ? Math.max(...MOCK_MESS_MENUS.map(m => m.id)) + 1 : 1;
    const newItem = {
      id: newId,
      hostel_id: params[0] !== undefined ? params[0] : null,
      menu_date: params[1],
      meal_type: params[2],
      meal_name: params[3],
      description: params[4] || null,
      is_available: params[5] !== undefined ? params[5] : 1,
      created_by: params[6] || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_MESS_MENUS.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('update mess_menus')) {
    const id = params[params.length - 1];
    const item = MOCK_MESS_MENUS.find(m => m.id === Number(id));
    if (item) {
      if (params[0] !== null && params[0] !== undefined) item.meal_name = params[0];
      if (params[1] !== null && params[1] !== undefined) item.description = params[1];
      if (params[2] !== null && params[2] !== undefined) item.is_available = params[2];
      item.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: item ? 1 : 0 }];
  }

  if (queryLower.includes('delete from mess_menus')) {
    const id = Number(params[0]);
    const initialLen = MOCK_MESS_MENUS.length;
    MOCK_MESS_MENUS = MOCK_MESS_MENUS.filter(m => m.id !== id);
    return [{ affectedRows: initialLen - MOCK_MESS_MENUS.length }];
  }

  if (queryLower.includes("show columns from complaints like 'category'")) {
    return [[{ Field: 'category', Type: "enum('ROOM','ELECTRICITY','WATER','PLUMBING','CLEANLINESS','FAN_AC','FURNITURE','FOOD_MESS','INTERNET','SECURITY','MAINTENANCE','OTHER')" }]];
  }

  if (queryLower.includes('from mess_menus')) {
    let result = [...MOCK_MESS_MENUS];

    if (queryLower.includes('m.id = ?') || queryLower.includes('where id = ?') || queryLower.includes('where m.id = ?')) {
      const id = Number(params[params.length - 1]);
      result = result.filter(m => m.id === id);
    }

    if (queryLower.includes('hostel_id = ?')) {
      const hId = params.find(p => typeof p === 'number' || p === null);
      if (hId !== undefined && hId !== null) {
        result = result.filter(m => m.hostel_id === Number(hId) || m.hostel_id === null);
      }
    }

    if (queryLower.includes('menu_date = ?') || queryLower.includes('m.menu_date = ?')) {
      const d = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      if (d) result = result.filter(m => m.menu_date === d);
    }

    if (queryLower.includes('meal_type = ?') || queryLower.includes('m.meal_type = ?')) {
      const mt = params.find(p => typeof p === 'string' && ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].includes(p.toUpperCase()));
      if (mt) result = result.filter(m => m.meal_type === mt.toUpperCase());
    }

    result = result.map(m => {
      const h = MOCK_HOSTELS.find(hostel => hostel.id === m.hostel_id);
      const u = MOCK_USERS.find(user => user.id === m.created_by);
      return {
        ...m,
        hostel_name: h ? h.name : (m.hostel_id === null ? 'All Hostels (Common)' : 'Hostel 1'),
        creator_name: u ? u.full_name : 'Admin'
      };
    });

    return [result];
  }

  // --- MEAL ATTENDANCE QUERIES ---
  if (queryLower.includes('insert into meal_attendance')) {
    const studentId = Number(params[0]);
    const hostelId = Number(params[1]);
    const mealDate = params[2];
    const mealType = params[3];
    const status = params[4];

    const idx = MOCK_MEAL_ATTENDANCE.findIndex(ma => ma.student_id === studentId && ma.meal_date === mealDate && ma.meal_type === mealType);
    if (idx >= 0) {
      MOCK_MEAL_ATTENDANCE[idx].status = status;
      MOCK_MEAL_ATTENDANCE[idx].marked_at = new Date().toISOString();
      return [{ insertId: MOCK_MEAL_ATTENDANCE[idx].id, affectedRows: 1 }];
    } else {
      const newId = MOCK_MEAL_ATTENDANCE.length > 0 ? Math.max(...MOCK_MEAL_ATTENDANCE.map(ma => ma.id)) + 1 : 1;
      MOCK_MEAL_ATTENDANCE.push({
        id: newId,
        student_id: studentId,
        hostel_id: hostelId,
        meal_date: mealDate,
        meal_type: mealType,
        status: status,
        marked_at: new Date().toISOString()
      });
      return [{ insertId: newId, affectedRows: 1 }];
    }
  }

  if (queryLower.includes('from meal_attendance')) {
    let result = [...MOCK_MEAL_ATTENDANCE];

    if (queryLower.includes('ma.student_id = ?')) {
      const sId = Number(params[0]);
      result = result.filter(ma => ma.student_id === sId);
    }

    if (queryLower.includes('ma.hostel_id = ?')) {
      const hId = Number(params[0]);
      result = result.filter(ma => ma.hostel_id === hId);
    }

    if (queryLower.includes('ma.meal_date = ?') || queryLower.includes('meal_date = ?')) {
      const d = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      if (d) result = result.filter(ma => ma.meal_date === d);
    }

    if (queryLower.includes('ma.meal_type = ?') || queryLower.includes('meal_type = ?')) {
      const mt = params.find(p => typeof p === 'string' && ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].includes(p.toUpperCase()));
      if (mt) result = result.filter(ma => ma.meal_type === mt.toUpperCase());
    }

    if (queryLower.includes('ma.status = ?')) {
      const st = params.find(p => typeof p === 'string' && ['TAKING', 'NOT_TAKING'].includes(p.toUpperCase()));
      if (st) result = result.filter(ma => ma.status === st.toUpperCase());
    }

    if (queryLower.includes('count(*) as total')) {
      return [[{ total: result.length }]];
    }

    if (queryLower.includes('group by meal_type, status')) {
      const grouped = [];
      const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
      mealTypes.forEach(mt => {
        ['TAKING', 'NOT_TAKING'].forEach(st => {
          const count = result.filter(r => r.meal_type === mt && r.status === st).length;
          if (count > 0) {
            grouped.push({ meal_type: mt, status: st, count });
          }
        });
      });
      return [grouped];
    }

    result = result.map(ma => {
      const st = MOCK_STUDENTS.find(s => s.id === ma.student_id) || MOCK_STUDENTS[0];
      const menu = MOCK_MESS_MENUS.find(m => (m.hostel_id === ma.hostel_id || m.hostel_id === null) && m.menu_date === ma.meal_date && m.meal_type === ma.meal_type);
      return {
        ...ma,
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        room_number: st ? st.room_number : '101',
        meal_name: menu ? menu.meal_name : 'Standard Meal',
        menu_description: menu ? menu.description : ''
      };
    });

    return [result];
  }

  // ==========================================
  // PHASE 11: HOSTEL FEES & PAYMENT MANAGEMENT
  // ==========================================

  // 1. fee_structures queries
  if (queryLower.includes('into fee_structures')) {
    const newId = MOCK_FEE_STRUCTURES.length > 0 ? Math.max(...MOCK_FEE_STRUCTURES.map(f => f.id)) + 1 : 1;
    const newItem = {
      id: newId,
      hostel_id: params[0],
      fee_type: params[1],
      name: params[2],
      description: params[3],
      amount: parseFloat(params[4]),
      frequency: params[5],
      academic_year: params[6],
      applicable_course: params[7],
      applicable_branch: params[8],
      applicable_year: params[9],
      is_active: 1,
      created_by: params[10],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_FEE_STRUCTURES.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('update fee_structures')) {
    const idParam = params[params.length - 1];
    const fsItem = MOCK_FEE_STRUCTURES.find(f => f.id === Number(idParam));
    if (fsItem) {
      if (queryLower.includes('is_active = ?')) {
        const val = params.find(p => p === 0 || p === 1 || p === true || p === false);
        fsItem.is_active = val ? 1 : 0;
      }
      fsItem.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: fsItem ? 1 : 0 }];
  }

  if (queryLower.includes('from fee_structures')) {
    let result = MOCK_FEE_STRUCTURES.map(fs => {
      const h = MOCK_HOSTELS.find(h => h.id === fs.hostel_id);
      const u = MOCK_USERS.find(u => u.id === fs.created_by);
      return {
        ...fs,
        hostel_name: h ? h.name : (fs.hostel_id === null ? 'All Hostels (Global)' : 'Hostel'),
        creator_name: u ? u.full_name : 'Admin'
      };
    });

    if (queryLower.includes('fs.id = ?') || queryLower.includes('where fs.id = ?')) {
      const targetId = Number(params[0]);
      return [[result.find(f => f.id === targetId)].filter(Boolean)];
    }

    if (queryLower.includes('fs.fee_type = ?')) {
      const ft = params.find(p => typeof p === 'string' && ['HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE', 'SECURITY_DEPOSIT', 'OTHER'].includes(p));
      if (ft) result = result.filter(f => f.fee_type === ft);
    }

    if (queryLower.includes('fs.academic_year = ?')) {
      const ay = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2,4}$/));
      if (ay) result = result.filter(f => f.academic_year === ay);
    }

    if (queryLower.includes('fs.is_active = ?')) {
      const ia = params.find(p => typeof p === 'number');
      if (ia !== undefined) result = result.filter(f => f.is_active === ia);
    }

    return [result];
  }

  // 2. student_fees queries
  if (queryLower.includes('into student_fees')) {
    const newId = MOCK_STUDENT_FEES.length > 0 ? Math.max(...MOCK_STUDENT_FEES.map(f => f.id)) + 1 : 1;
    const newItem = {
      id: newId,
      student_id: params[0],
      hostel_id: params[1],
      fee_structure_id: params[2],
      academic_year: params[3],
      amount: parseFloat(params[4]),
      paid_amount: 0.00,
      due_date: params[5],
      status: params[6] || 'PENDING',
      waiver_reason: null,
      waived_by: null,
      waived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_STUDENT_FEES.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('update student_fees')) {
    const idParam = params[params.length - 1];
    const sfItem = MOCK_STUDENT_FEES.find(sf => sf.id === Number(idParam));
    if (sfItem) {
      if (queryLower.includes('paid_amount = ?')) {
        sfItem.paid_amount = parseFloat(params[0]);
        if (queryLower.includes('status = ?')) sfItem.status = params[1];
      } else if (queryLower.includes("status = 'waived'")) {
        sfItem.status = 'WAIVED';
        sfItem.waiver_reason = params[0];
        sfItem.waived_by = params[1];
        sfItem.waived_at = new Date().toISOString();
      }
      sfItem.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: sfItem ? 1 : 0 }];
  }

  if (queryLower.includes('from student_fees')) {
    // Summary aggregation queries
    if (queryLower.includes('sum(sf.amount) as total_assigned') || queryLower.includes('sum(amount) as total_fees')) {
      let filtered = [...MOCK_STUDENT_FEES];
      if (queryLower.includes('sf.hostel_id = ?')) {
        const hId = Number(params[0]);
        filtered = filtered.filter(f => f.hostel_id === hId);
      }
      if (queryLower.includes('student_id = ?')) {
        const sId = Number(params[0]);
        filtered = filtered.filter(f => f.student_id === sId);
      }
      const activeFees = filtered.filter(f => f.status !== 'WAIVED');
      const totalAssigned = activeFees.reduce((acc, f) => acc + parseFloat(f.amount), 0);
      const totalCollected = activeFees.reduce((acc, f) => acc + parseFloat(f.paid_amount), 0);
      const totalPending = Math.max(0, totalAssigned - totalCollected);
      return [[{ total_assigned: totalAssigned, total_fees: totalAssigned, total_collected: totalCollected, total_paid: totalCollected, total_pending: totalPending }]];
    }

    if (queryLower.includes('sum(sf.amount - sf.paid_amount) as total_overdue') || queryLower.includes('sum(amount - paid_amount) as total_overdue')) {
      const todayStr = new Date().toISOString().split('T')[0];
      let filtered = MOCK_STUDENT_FEES.filter(f => f.status !== 'WAIVED' && f.status !== 'PAID' && f.due_date < todayStr);
      if (queryLower.includes('sf.hostel_id = ?')) {
        const hId = Number(params[params.length - 1]);
        filtered = filtered.filter(f => f.hostel_id === hId);
      }
      if (queryLower.includes('student_id = ?')) {
        const sId = Number(params[0]);
        filtered = filtered.filter(f => f.student_id === sId);
      }
      const overdueSum = filtered.reduce((acc, f) => acc + (parseFloat(f.amount) - parseFloat(f.paid_amount)), 0);
      return [[{ total_overdue: Math.max(0, overdueSum) }]];
    }

    let result = MOCK_STUDENT_FEES.map(sf => {
      const st = MOCK_STUDENTS.find(s => s.id === sf.student_id) || MOCK_STUDENTS[0];
      const h = MOCK_HOSTELS.find(h => h.id === sf.hostel_id) || MOCK_HOSTELS[0];
      const fs = MOCK_FEE_STRUCTURES.find(f => f.id === sf.fee_structure_id);
      const wb = MOCK_USERS.find(u => u.id === sf.waived_by);
      return {
        ...sf,
        remaining_amount: Math.max(0, parseFloat(sf.amount) - parseFloat(sf.paid_amount)),
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        room_number: st ? st.room_number : '101',
        branch: st ? st.branch : 'CSE',
        course: st ? st.course : 'B.Tech',
        hostel_name: h ? h.name : 'Meridian Boys Hostel',
        fee_name: fs ? fs.name : 'Hostel Fee',
        fee_type: fs ? fs.fee_type : 'HOSTEL_FEE',
        frequency: fs ? fs.frequency : 'YEARLY',
        waived_by_name: wb ? wb.full_name : null
      };
    });

    if (queryLower.includes('sf.id = ?') || (queryLower.includes('where sf.id = ?') || (queryLower.includes('where id = ?')))) {
      const targetId = Number(params[0]);
      const found = result.find(sf => sf.id === targetId);
      return [[found].filter(Boolean)];
    }

    if (queryLower.includes('where sf.student_id = ?') || queryLower.includes('where student_id = ?')) {
      const sId = Number(params[0]);
      result = result.filter(sf => sf.student_id === sId);
    }

    if (queryLower.includes('fee_structure_id = ?')) {
      const fsId = Number(params[1] !== undefined ? params[1] : params[0]);
      result = result.filter(sf => sf.fee_structure_id === fsId);
    }

    if (queryLower.includes('academic_year = ?')) {
      const ay = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2,4}$/));
      if (ay) result = result.filter(sf => sf.academic_year === ay);
    }

    if (queryLower.includes('id = ?') && !queryLower.includes('student_id') && !queryLower.includes('hostel_id') && !queryLower.includes('fee_structure_id')) {
      const targetId = Number(params[0]);
      return [[result.find(sf => sf.id === targetId)].filter(Boolean)];
    }

    if (queryLower.includes('hostel_id = ?')) {
      const hId = Number(params[params.length - 1]);
      result = result.filter(sf => sf.hostel_id === hId);
    }

    if (queryLower.includes('status = ?')) {
      const st = params.find(p => typeof p === 'string' && ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'].includes(p));
      if (st) result = result.filter(sf => sf.status === st);
    }

    if (queryLower.includes('status != "waived"') || queryLower.includes("status != 'waived'")) {
      result = result.filter(sf => sf.status !== 'WAIVED');
    }

    if (queryLower.includes('count(*) as total')) {
      return [[{ total: result.length }]];
    }

    return [result];
  }

  // 3. fee_payments queries
  if (queryLower.includes('into fee_payments')) {
    const newId = MOCK_FEE_PAYMENTS.length > 0 ? Math.max(...MOCK_FEE_PAYMENTS.map(p => p.id)) + 1 : 1;
    const newItem = {
      id: newId,
      student_fee_id: params[0],
      student_id: params[1],
      hostel_id: params[2],
      amount: parseFloat(params[3]),
      payment_method: params[4],
      receipt_number: params[5],
      transaction_reference: params[6],
      payment_date: params[7],
      received_by: params[8],
      notes: params[9],
      created_at: new Date().toISOString()
    };
    MOCK_FEE_PAYMENTS.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('from fee_payments')) {
    let result = MOCK_FEE_PAYMENTS.map(fp => {
      const st = MOCK_STUDENTS.find(s => s.id === fp.student_id) || MOCK_STUDENTS[0];
      const h = MOCK_HOSTELS.find(h => h.id === fp.hostel_id) || MOCK_HOSTELS[0];
      const sf = MOCK_STUDENT_FEES.find(s => s.id === fp.student_fee_id);
      const fs = sf ? MOCK_FEE_STRUCTURES.find(f => f.id === sf.fee_structure_id) : null;
      const u = MOCK_USERS.find(u => u.id === fp.received_by);
      return {
        ...fp,
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        room_number: st ? st.room_number : '101',
        hostel_name: h ? h.name : 'Meridian Boys Hostel',
        academic_year: sf ? sf.academic_year : '2026-27',
        total_fee_amount: sf ? parseFloat(sf.amount) : 30000.00,
        current_total_paid: sf ? parseFloat(sf.paid_amount) : 10000.00,
        fee_name: fs ? fs.name : 'Hostel Fee',
        fee_type: fs ? fs.fee_type : 'HOSTEL_FEE',
        received_by_name: u ? u.full_name : 'Warden / Staff'
      };
    });

    if (queryLower.includes('fp.id = ?') || queryLower.includes('where fp.id = ?')) {
      const targetId = Number(params[0]);
      return [[result.find(p => p.id === targetId)].filter(Boolean)];
    }

    if (queryLower.includes('fp.student_fee_id = ?')) {
      const sfId = Number(params[0]);
      result = result.filter(p => p.student_fee_id === sfId);
    }

    if (queryLower.includes('transaction_reference = ?')) {
      const ref = params[0];
      result = result.filter(p => p.transaction_reference === ref);
    }

    if (queryLower.includes('count(*) as cnt') || queryLower.includes('count(*) as total')) {
      return [[{ cnt: result.length, total: result.length }]];
    }

    return [result];
  }

  // 4. fee_history queries
  if (queryLower.includes('into fee_history')) {
    const newId = MOCK_FEE_HISTORY.length > 0 ? Math.max(...MOCK_FEE_HISTORY.map(h => h.id)) + 1 : 1;
    const newItem = {
      id: newId,
      student_fee_id: params[0],
      changed_by: params[1],
      action: params[2],
      old_value: params[3],
      new_value: params[4],
      reason: params[5],
      created_at: new Date().toISOString()
    };
    MOCK_FEE_HISTORY.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('from fee_history')) {
    let result = MOCK_FEE_HISTORY.map(fh => {
      const u = MOCK_USERS.find(u => u.id === fh.changed_by);
      return {
        ...fh,
        changed_by_name: u ? u.full_name : 'System Admin'
      };
    });

    if (queryLower.includes('fh.student_fee_id = ?') || queryLower.includes('student_fee_id = ?')) {
      const sfId = Number(params[0]);
      result = result.filter(h => h.student_fee_id === sfId);
    }

    return [result];
  }

  // student_allocations mock handling
  if (queryLower.includes('into student_allocations')) {
    const newId = MOCK_STUDENT_ALLOCATIONS.length > 0 ? Math.max(...MOCK_STUDENT_ALLOCATIONS.map(a => a.id)) + 1 : 1;
    const newItem = {
      id: newId,
      student_id: Number(params[0]),
      hostel_id: Number(params[1]),
      room_id: Number(params[2]),
      bed_id: Number(params[3]),
      allocated_from: params[4],
      allocated_until: null,
      status: 'ACTIVE',
      allocated_by: Number(params[5]),
      checkout_reason: null,
      transfer_reason: params[6] || null,
      custom_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_STUDENT_ALLOCATIONS.push(newItem);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (queryLower.includes('update student_allocations')) {
    if (queryLower.includes('status = \'transferred\'') || queryLower.includes('status = \'checked_out\'')) {
      const allocId = Number(params[params.length - 1]);
      const alloc = MOCK_STUDENT_ALLOCATIONS.find(a => a.id === allocId);
      if (alloc) {
        if (queryLower.includes('status = \'transferred\'')) {
          alloc.status = 'TRANSFERRED';
          alloc.allocated_until = params[0];
          alloc.transfer_reason = params[1];
        } else {
          alloc.status = 'CHECKED_OUT';
          alloc.allocated_until = params[0];
          alloc.checkout_reason = params[1];
          alloc.custom_reason = params[2];
        }
      }
    }
    return [{ affectedRows: 1 }];
  }

  if (queryLower.includes('update students set bed_id')) {
    if (queryLower.includes('bed_id = null')) {
      const studentId = Number(params[0]);
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      if (student) student.bed_id = null;
    } else {
      const studentId = Number(params[1]);
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      if (student) student.bed_id = Number(params[0]);
    }
    return [{ affectedRows: 1 }];
  }

  if (queryLower.includes('from beds')) {
    const bedId = Number(params[0]);
    return [[{ id: bedId, status: 'AVAILABLE', room_id: 1, hostel_id: 1, bed_number: 'A-1', room_number: '101', hostel_name: 'Meridian Boys Hostel' }]];
  }

  if (queryLower.includes('from student_allocations')) {
    let result = MOCK_STUDENT_ALLOCATIONS.map(sa => {
      const st = MOCK_STUDENTS.find(s => s.id === sa.student_id) || MOCK_STUDENTS[0];
      const h = MOCK_HOSTELS.find(h => h.id === sa.hostel_id) || MOCK_HOSTELS[0];
      const u = MOCK_USERS.find(u => u.id === sa.allocated_by);
      return {
        ...sa,
        student_name: st ? st.full_name : 'John Doe',
        student_code: st ? st.student_id : 'STD2026001',
        roll_number: st ? st.roll_number : 'CSE-2026-089',
        student_status: st ? st.status : 'ACTIVE',
        branch: st ? st.branch : 'Computer Science',
        course: st ? st.course : 'B.Tech',
        photo_url: st ? st.photo_url : null,
        phone: st ? st.phone : '9876543210',
        email: st ? st.email : 'student@hostel.com',
        hostel_name: h ? h.name : 'Meridian Boys Hostel',
        hostel_code: h ? h.code : 'MBH',
        room_number: sa.room_id === 1 ? '101' : (sa.room_id === 2 ? '102' : '201'),
        bed_number: sa.bed_id === 1 ? 'A-1' : (sa.bed_id === 2 ? 'A-2' : 'A-3'),
        allocated_by_username: u ? u.username : 'superadmin'
      };
    });

    if (queryLower.includes('sa.id = ?') || queryLower.includes('where sa.id = ?')) {
      const targetId = Number(params[0]);
      const found = result.find(a => a.id === targetId);
      return [found ? [found] : []];
    }

    if (queryLower.includes('student_id = ?')) {
      const sId = Number(params[0]);
      result = result.filter(a => a.student_id === sId);
    }

    if (queryLower.includes('status = \'active\'')) {
      result = result.filter(a => a.status === 'ACTIVE');
    }

    if (queryLower.includes('count(*) as total')) {
      return [[{ total: result.length }]];
    }

    return [result];
  }

  // 5. Mock Report Aggregations Handling
  if (queryLower.includes('from students') && queryLower.includes('group by')) {
    if (queryLower.includes('s.branch')) {
      return [[
        { branch: 'Computer Science', count: MOCK_STUDENTS.filter(s => s.branch === 'Computer Science' || !s.branch).length || 10 },
        { branch: 'Electrical Eng', count: MOCK_STUDENTS.filter(s => s.branch === 'Electrical Eng').length || 5 },
        { branch: 'Mechanical Eng', count: MOCK_STUDENTS.filter(s => s.branch === 'Mechanical Eng').length || 4 }
      ]];
    }
    if (queryLower.includes('s.course')) {
      return [[
        { course: 'B.Tech', count: MOCK_STUDENTS.filter(s => s.course === 'B.Tech' || !s.course).length || 15 },
        { course: 'M.Tech', count: MOCK_STUDENTS.filter(s => s.course === 'M.Tech').length || 4 }
      ]];
    }
    if (queryLower.includes('s.year')) {
      return [[
        { year: '1', count: 6 },
        { year: '2', count: 5 },
        { year: '3', count: 5 },
        { year: '4', count: 3 }
      ]];
    }
  }

  if (queryLower.includes('from hostels') && queryLower.includes('group by h.id')) {
    return [MOCK_HOSTELS.map(h => ({
      hostel_id: h.id,
      hostel_name: h.name,
      student_count: MOCK_STUDENTS.filter(s => s.hostel_id === h.id).length || 3,
      totalBeds: 50,
      occupied: 35,
      available: 12,
      maintenance: 3
    }))];
  }

  if (queryLower.includes('from attendance') && queryLower.includes('group by attendance_date')) {
    const today = new Date().toISOString().split('T')[0];
    return [[
      { attendance_date: today, present: 18, absent: 2, attendancePercentage: 90.0 }
    ]];
  }

  if (queryLower.includes('from complaints') && queryLower.includes('group by')) {
    if (queryLower.includes('category')) {
      return [[
        { category: 'PLUMBING', count: MOCK_COMPLAINTS.filter(c => c.category === 'PLUMBING').length || 3 },
        { category: 'ELECTRICITY', count: MOCK_COMPLAINTS.filter(c => c.category === 'ELECTRICITY').length || 2 },
        { category: 'CLEANLINESS', count: MOCK_COMPLAINTS.filter(c => c.category === 'CLEANLINESS').length || 1 }
      ]];
    }
    if (queryLower.includes('priority')) {
      return [[
        { priority: 'MEDIUM', count: 4 },
        { priority: 'HIGH', count: 2 },
        { priority: 'URGENT', count: 1 }
      ]];
    }
    if (queryLower.includes('date(created_at)')) {
      const today = new Date().toISOString().split('T')[0];
      return [[{ complaint_date: today, count: 2 }]];
    }
  }

  if (queryLower.includes('from visits') && queryLower.includes('group by')) {
    if (queryLower.includes('relation')) {
      return [[
        { relation: 'Parent', count: 4 },
        { relation: 'Friend', count: 2 },
        { relation: 'Relative', count: 1 }
      ]];
    }
    if (queryLower.includes('visit_date')) {
      const today = new Date().toISOString().split('T')[0];
      return [[{ visit_date: today, count: 3 }]];
    }
  }

  if (queryLower.includes('from meal_attendance') && queryLower.includes('group by ma.meal_type')) {
    return [[
      { meal_type: 'BREAKFAST', takingCount: 15, notTakingCount: 3, totalResponses: 18 },
      { meal_type: 'LUNCH', takingCount: 17, notTakingCount: 1, totalResponses: 18 },
      { meal_type: 'SNACKS', takingCount: 12, notTakingCount: 6, totalResponses: 18 },
      { meal_type: 'DINNER', takingCount: 16, notTakingCount: 2, totalResponses: 18 }
    ]];
  }

  if (queryLower.includes('from student_fees') && queryLower.includes('group by fee_type')) {
    return [[
      { fee_type: 'HOSTEL_FEE', expected: 150000.00, collected: 100000.00 },
      { fee_type: 'MESS_FEE', expected: 60000.00, collected: 45000.00 }
    ]];
  }

  if (queryLower.includes('from fee_payments') && queryLower.includes('group by fp.payment_date')) {
    const today = new Date().toISOString().split('T')[0];
    return [[
      { payment_date: today, total_collected: 25000.00, transaction_count: 2 }
    ]];
  }

  if (queryLower.includes('select coalesce(sum(amount)') || (queryLower.includes('from student_fees') && queryLower.includes('sum(paid_amount)'))) {
    const totalExp = MOCK_STUDENT_FEES.reduce((acc, f) => acc + (f.status !== 'WAIVED' ? Number(f.amount) : 0), 0) || 210000.00;
    const totalCol = MOCK_STUDENT_FEES.reduce((acc, f) => acc + (f.status !== 'WAIVED' ? Number(f.paid_amount) : 0), 0) || 145000.00;
    const totalWaived = MOCK_STUDENT_FEES.reduce((acc, f) => acc + (f.status === 'WAIVED' ? Number(f.amount) : 0), 0) || 0;
    return [[{
      totalExpected: totalExp,
      totalCollected: totalCol,
      totalPending: totalExp - totalCol,
      totalOverdue: 20000.00,
      totalWaived: totalWaived
    }]];
  }

  // Fallback / default mock response
  return [[]];
};

// Unified Pool wrapper delegating to live MySQL or Mock fallback
const pool = {
  query: async (sql, params) => {
    if (isOffline) {
      return mockQuery(sql, params);
    }
    try {
      return await realPool.query(sql, params);
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('denied')) {
        isOffline = true;
        console.warn('\x1b[33m%s\x1b[0m', 'Database offline. Mock database engine activated.');
        return mockQuery(sql, params);
      }
      throw error;
    }
  },
  getConnection: async () => {
    if (isOffline) {
      return {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        query: async (sql, params) => mockQuery(sql, params),
        release: () => {}
      };
    }
    try {
      return await realPool.getConnection();
    } catch (error) {
      isOffline = true;
      console.warn('\x1b[33m%s\x1b[0m', 'Database offline. Mock database engine activated.');
      return {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        query: async (sql, params) => mockQuery(sql, params),
        release: () => {}
      };
    }
  },
  end: async () => {
    if (isOffline) return;
    return realPool.end();
  }
};

const testConnection = async () => {
  try {
    const connection = await realPool.getConnection();
    console.log('\x1b[32m%s\x1b[0m', 'MySQL Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    isOffline = true;
    console.error('\x1b[31m%s\x1b[0m', 'MySQL Database connection failed:');
    console.error(error.message);
    console.warn('\x1b[33m%s\x1b[0m', 'Development Fallback: Mock database engine activated.');
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
