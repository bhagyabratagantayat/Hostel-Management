const db = require('../config/db');
const authorization = require('../utils/authorization');

/**
 * Retrieves all hostels based on user's authorization.
 */
const getAllHostels = async (user) => {
  const { id: userId, role } = user;

  const statsFields = `
    (SELECT COUNT(*) FROM floors f WHERE f.hostel_id = h.id) as total_floors,
    (SELECT COUNT(*) FROM rooms r WHERE r.hostel_id = h.id) as total_rooms,
    (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = h.id) as total_beds,
    (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = h.id AND b.status = 'AVAILABLE') as available_beds,
    (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = h.id AND b.status = 'OCCUPIED') as occupied_beds,
    (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = h.id AND b.status = 'MAINTENANCE') as maintenance_beds
  `;

  let query = '';
  let queryParams = [];

  if (role === 'SUPER_ADMIN') {
    // Super Admins see all hostels with counts
    query = `SELECT h.id, h.name, h.code, h.gender, h.location, h.status, ${statsFields} FROM hostels h ORDER BY h.id ASC`;
  } else if (role === 'SUPERINTENDENT') {
    // Superintendents see only assigned hostels
    query = `
      SELECT h.id, h.name, h.code, h.gender, h.location, h.status, ${statsFields} 
      FROM hostels h
      JOIN superintendent_hostels sh ON h.id = sh.hostel_id
      WHERE sh.user_id = ?
      ORDER BY h.id ASC
    `;
    queryParams = [userId];
  } else if (role === 'STUDENT') {
    // Students see only their assigned hostel
    query = `
      SELECT h.id, h.name, h.code, h.gender, h.location, h.status, ${statsFields} 
      FROM hostels h
      JOIN rooms r ON h.id = r.hostel_id
      JOIN beds b ON r.id = b.room_id
      JOIN students s ON b.id = s.bed_id
      WHERE s.user_id = ? AND h.status = "ACTIVE"
    `;
    queryParams = [userId];
  } else {
    throw new Error('Forbidden: Unknown user role.');
  }

  const [rows] = await db.pool.query(query, queryParams);
  return rows;
};

/**
 * Retrieves a single hostel by ID, checking user permissions.
 */
const getHostelById = async (hostelId, user) => {
  const hasAccess = await authorization.hasHostelAccess(user, hostelId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this hostel.');
    error.status = 403;
    throw error;
  }

  const [rows] = await db.pool.query(
    'SELECT id, name, code, gender, location, status FROM hostels WHERE id = ?',
    [hostelId]
  );
  if (rows.length === 0) {
    const error = new Error('Hostel not found.');
    error.status = 404;
    throw error;
  }
  return rows[0];
};

/**
 * Creates a new hostel (Super Admin only).
 */
const createHostel = async (hostelData) => {
  const { name, code, gender, location, status } = hostelData;

  // Validation
  if (!name || !name.trim()) {
    const error = new Error('Hostel name is required.');
    error.status = 400;
    throw error;
  }
  if (!code || !code.trim()) {
    const error = new Error('Hostel code is required.');
    error.status = 400;
    throw error;
  }
  if (!['MALE', 'FEMALE', 'COED'].includes(gender)) {
    const error = new Error('Invalid gender specification.');
    error.status = 400;
    throw error;
  }
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints
  const [existingName] = await db.pool.query('SELECT id FROM hostels WHERE name = ?', [name.trim()]);
  if (existingName.length > 0) {
    const error = new Error('Hostel name already exists.');
    error.status = 400;
    throw error;
  }

  const [existingCode] = await db.pool.query('SELECT id FROM hostels WHERE code = ?', [code.trim()]);
  if (existingCode.length > 0) {
    const error = new Error('Hostel code already exists.');
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query(
    'INSERT INTO hostels (name, code, gender, location, status) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), code.trim(), gender, location || '', status]
  );

  return { id: result.insertId, name, code, gender, location, status };
};

/**
 * Updates an existing hostel (Super Admin only).
 */
const updateHostel = async (hostelId, hostelData) => {
  const { name, code, gender, location, status } = hostelData;

  // Validation
  if (!name || !name.trim()) {
    const error = new Error('Hostel name is required.');
    error.status = 400;
    throw error;
  }
  if (!code || !code.trim()) {
    const error = new Error('Hostel code is required.');
    error.status = 400;
    throw error;
  }
  if (!['MALE', 'FEMALE', 'COED'].includes(gender)) {
    const error = new Error('Invalid gender specification.');
    error.status = 400;
    throw error;
  }
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints excluding current ID
  const [existingName] = await db.pool.query(
    'SELECT id FROM hostels WHERE name = ? AND id != ?',
    [name.trim(), hostelId]
  );
  if (existingName.length > 0) {
    const error = new Error('Hostel name already exists.');
    error.status = 400;
    throw error;
  }

  const [existingCode] = await db.pool.query(
    'SELECT id FROM hostels WHERE code = ? AND id != ?',
    [code.trim(), hostelId]
  );
  if (existingCode.length > 0) {
    const error = new Error('Hostel code already exists.');
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query(
    'UPDATE hostels SET name = ?, code = ?, gender = ?, location = ?, status = ? WHERE id = ?',
    [name.trim(), code.trim(), gender, location || '', status, hostelId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Hostel not found.');
    error.status = 404;
    throw error;
  }

  return { id: hostelId, name, code, gender, location, status };
};

/**
 * Safely deletes a hostel (Super Admin only).
 */
const deleteHostel = async (hostelId) => {
  // Check if hostel contains floors
  const [floors] = await db.pool.query('SELECT id FROM floors WHERE hostel_id = ? LIMIT 1', [hostelId]);
  if (floors.length > 0) {
    const error = new Error('Cannot delete hostel: It has active floors configured. Deactivate the hostel or remove dependent floors first.');
    error.status = 400;
    throw error;
  }

  // Check if hostel contains rooms
  const [rooms] = await db.pool.query('SELECT id FROM rooms WHERE hostel_id = ? LIMIT 1', [hostelId]);
  if (rooms.length > 0) {
    const error = new Error('Cannot delete hostel: It has active rooms configured. Remove dependent rooms first.');
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query('DELETE FROM hostels WHERE id = ?', [hostelId]);
  if (result.affectedRows === 0) {
    const error = new Error('Hostel not found.');
    error.status = 404;
    throw error;
  }

  return { success: true };
};

/**
 * Retrieves summary statistics for a hostel.
 */
const getHostelSummary = async (hostelId, user) => {
  const hostel = await getHostelById(hostelId, user);

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM floors WHERE hostel_id = ?) as total_floors,
      (SELECT COUNT(*) FROM rooms WHERE hostel_id = ?) as total_rooms,
      (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = ?) as total_beds,
      (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = ? AND b.status = 'AVAILABLE') as available_beds,
      (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = ? AND b.status = 'OCCUPIED') as occupied_beds,
      (SELECT COUNT(*) FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.hostel_id = ? AND b.status = 'MAINTENANCE') as maintenance_beds
  `;

  const [rows] = await db.pool.query(query, [
    hostelId, hostelId, hostelId, hostelId, hostelId, hostelId
  ]);

  const stats = rows[0];

  return {
    hostel: {
      id: hostel.id,
      name: hostel.name,
      code: hostel.code,
      gender: hostel.gender,
      location: hostel.location,
      status: hostel.status
    },
    statistics: {
      floors: stats.total_floors || 0,
      rooms: stats.total_rooms || 0,
      beds: stats.total_beds || 0,
      availableBeds: stats.available_beds || 0,
      occupiedBeds: stats.occupied_beds || 0,
      maintenanceBeds: stats.maintenance_beds || 0
    }
  };
};

module.exports = {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelSummary
};
