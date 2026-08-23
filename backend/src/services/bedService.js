const db = require('../config/db');
const authorization = require('../utils/authorization');

/**
 * Retrieves all beds based on filters and permissions.
 */
const getAllBeds = async (filters, user) => {
  const { room_id, status } = filters;
  const { id: userId, role } = user;

  let query = `
    SELECT b.*, r.room_number, r.hostel_id, h.name as hostel_name 
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    JOIN hostels h ON r.hostel_id = h.id
  `;
  let queryParams = [];
  let conditions = [];

  if (room_id) {
    const hasAccess = await authorization.hasRoomAccess(user, room_id);
    if (!hasAccess) {
      const error = new Error('Forbidden: You do not have access to this room\'s beds.');
      error.status = 403;
      throw error;
    }
    conditions.push('b.room_id = ?');
    queryParams.push(room_id);
  } else {
    if (role === 'SUPERINTENDENT') {
      const assigned = await authorization.getAssignedHostels(userId);
      if (assigned.length === 0) return [];
      conditions.push('r.hostel_id IN (?)');
      queryParams.push([assigned]);
    } else if (role === 'STUDENT') {
      const error = new Error('Forbidden: Students cannot access bed listings.');
      error.status = 403;
      throw error;
    }
  }

  if (status) {
    conditions.push('b.status = ?');
    queryParams.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY r.hostel_id ASC, b.room_id ASC, b.bed_number ASC';
  const [rows] = await db.pool.query(query, queryParams);
  return rows;
};

/**
 * Retrieves a single bed by ID.
 */
const getBedById = async (bedId, user) => {
  const hasAccess = await authorization.hasBedAccess(user, bedId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this bed.');
    error.status = 403;
    throw error;
  }

  const [rows] = await db.pool.query(
    `SELECT b.*, r.room_number, r.hostel_id, h.name as hostel_name 
     FROM beds b 
     JOIN rooms r ON b.room_id = r.id 
     JOIN hostels h ON r.hostel_id = h.id 
     WHERE b.id = ?`,
    [bedId]
  );
  if (rows.length === 0) {
    const error = new Error('Bed not found.');
    error.status = 404;
    throw error;
  }
  return rows[0];
};

/**
 * Creates a new bed.
 */
const createBed = async (bedData, user) => {
  const { room_id, bed_number, status } = bedData;

  if (!room_id) {
    const error = new Error('Room ID is required.');
    error.status = 400;
    throw error;
  }

  const hasAccess = await authorization.hasRoomAccess(user, room_id);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to manage this room.');
    error.status = 403;
    throw error;
  }

  if (!bed_number || !bed_number.trim()) {
    const error = new Error('Bed number is required.');
    error.status = 400;
    throw error;
  }

  const targetStatus = status || 'AVAILABLE';
  if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(targetStatus)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Get room capacity and existing bed count using a transaction or consistent lock check
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    const [roomRow] = await connection.query(
      'SELECT capacity, room_number FROM rooms WHERE id = ? FOR UPDATE',
      [room_id]
    );

    if (roomRow.length === 0) {
      const error = new Error('Room not found.');
      error.status = 404;
      throw error;
    }

    const { capacity, room_number: roomNum } = roomRow[0];

    const [countRow] = await connection.query(
      'SELECT COUNT(*) as count FROM beds WHERE room_id = ? FOR UPDATE',
      [room_id]
    );
    const existingBeds = countRow[0].count;

    if (existingBeds >= capacity) {
      const error = new Error(`Cannot add bed: Room ${roomNum} capacity limit of ${capacity} reached.`);
      error.status = 400;
      throw error;
    }

    // Check unique bed number in this room
    const [duplicateBed] = await connection.query(
      'SELECT id FROM beds WHERE room_id = ? AND bed_number = ?',
      [room_id, bed_number.trim()]
    );
    if (duplicateBed.length > 0) {
      const error = new Error(`Bed number "${bed_number}" already exists in Room ${roomNum}.`);
      error.status = 400;
      throw error;
    }

    const [result] = await connection.query(
      'INSERT INTO beds (room_id, bed_number, status) VALUES (?, ?, ?)',
      [room_id, bed_number.trim(), targetStatus]
    );

    await connection.commit();
    return { id: result.insertId, room_id, bed_number, status: targetStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Updates an existing bed.
 */
const updateBed = async (bedId, bedData, user) => {
  const { bed_number, status } = bedData;

  const currentBed = await getBedById(bedId, user);
  const roomId = currentBed.room_id;

  if (!bed_number || !bed_number.trim()) {
    const error = new Error('Bed number is required.');
    error.status = 400;
    throw error;
  }

  if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints in the room (excluding current bed ID)
  const [duplicateBed] = await db.pool.query(
    'SELECT id FROM beds WHERE room_id = ? AND bed_number = ? AND id != ?',
    [roomId, bed_number.trim(), bedId]
  );
  if (duplicateBed.length > 0) {
    const error = new Error(`Bed number "${bed_number}" already exists in this room.`);
    error.status = 400;
    throw error;
  }

  await db.pool.query(
    'UPDATE beds SET bed_number = ?, status = ? WHERE id = ?',
    [bed_number.trim(), status, bedId]
  );

  return { id: bedId, room_id: roomId, bed_number, status };
};

/**
 * Safely deletes a bed.
 */
const deleteBed = async (bedId, user) => {
  // Check permission
  const hasAccess = await authorization.hasBedAccess(user, bedId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this bed.');
    error.status = 403;
    throw error;
  }

  // Check if bed is assigned to a student
  const [studentRow] = await db.pool.query(
    'SELECT id, full_name FROM students WHERE bed_id = ? LIMIT 1',
    [bedId]
  );
  if (studentRow.length > 0) {
    const error = new Error(`Cannot delete bed: It is currently assigned to student ${studentRow[0].full_name}.`);
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query('DELETE FROM beds WHERE id = ?', [bedId]);
  if (result.affectedRows === 0) {
    const error = new Error('Bed not found.');
    error.status = 404;
    throw error;
  }

  return { success: true };
};

module.exports = {
  getAllBeds,
  getBedById,
  createBed,
  updateBed,
  deleteBed
};
