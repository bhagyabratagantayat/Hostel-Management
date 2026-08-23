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
