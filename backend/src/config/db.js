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
  { id: 3, role_id: 3, role: 'STUDENT', username: 'student', email: 'student@hostel.com', password_hash: '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', status: 'ACTIVE' }
];

const MOCK_SUPER_HOSTELS = [
  { id: 1, user_id: 2, hostel_id: 1 },
  { id: 2, user_id: 2, hostel_id: 3 }
];

const MOCK_STUDENTS = [
  {
    id: 1,
    user_id: 3,
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
  }
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

  // 1. SELECT users u JOIN roles r (check active user profile)
  if (queryLower.includes('from users u') && queryLower.includes('u.id = ?')) {
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
  if (queryLower.includes('from students s') && queryLower.includes('s.user_id = ?')) {
    const userId = params[0];
    const student = MOCK_STUDENTS.find(s => s.user_id === Number(userId));
    return student ? [[student]] : [[]];
  }
  
  if (queryLower.includes('from students s') && queryLower.includes('s.id = ?')) {
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
      // If error indicates connection issues, fall back to mock
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
        query: async (sql, params) => mockQuery(sql, params),
        release: () => {}
      };
    }
    return realPool.getConnection();
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
