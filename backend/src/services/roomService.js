const db = require('../config/db');
const authorization = require('../utils/authorization');

/**
 * Retrieves all rooms based on filters and permissions.
 */
const getAllRooms = async (filters, user) => {
  const { hostel_id, floor_id, search } = filters;
  const { id: userId, role } = user;

  let query = `
    SELECT r.*, h.name as hostel_name, f.floor_name 
    FROM rooms r
    JOIN hostels h ON r.hostel_id = h.id
    JOIN floors f ON r.floor_id = f.id
  `;
  let queryParams = [];
  let conditions = [];

  if (hostel_id) {
    const hasAccess = await authorization.hasHostelAccess(user, hostel_id);
    if (!hasAccess) {
      const error = new Error('Forbidden: You do not have access to this hostel\'s rooms.');
      error.status = 403;
      throw error;
    }
    conditions.push('r.hostel_id = ?');
    queryParams.push(hostel_id);
  } else {
    if (role === 'SUPERINTENDENT') {
      const assigned = await authorization.getAssignedHostels(userId);
      if (assigned.length === 0) return [];
      conditions.push('r.hostel_id IN (?)');
      queryParams.push([assigned]);
    } else if (role === 'STUDENT') {
      const error = new Error('Forbidden: Students cannot access room listings.');
      error.status = 403;
      throw error;
    }
  }

  if (floor_id) {
    conditions.push('r.floor_id = ?');
    queryParams.push(floor_id);
  }

  if (search && search.trim()) {
    conditions.push('r.room_number LIKE ?');
    queryParams.push(`%${search.trim()}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY r.hostel_id ASC, r.floor_id ASC, r.room_number ASC';
  const [rows] = await db.pool.query(query, queryParams);
  return rows;
};

/**
 * Retrieves a single room by ID.
 */
const getRoomById = async (roomId, user) => {
  const hasAccess = await authorization.hasRoomAccess(user, roomId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this room.');
    error.status = 403;
    throw error;
  }

  const [rows] = await db.pool.query(
    `SELECT r.*, h.name as hostel_name, f.floor_name 
     FROM rooms r 
     JOIN hostels h ON r.hostel_id = h.id 
     JOIN floors f ON r.floor_id = f.id 
     WHERE r.id = ?`,
    [roomId]
  );
  if (rows.length === 0) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }
  return rows[0];
};

/**
 * Creates a new room.
 */
const createRoom = async (roomData, user) => {
  const { hostel_id, floor_id, room_number, capacity, status } = roomData;

  if (!hostel_id) {
    const error = new Error('Hostel ID is required.');
    error.status = 400;
    throw error;
  }
  if (!floor_id) {
    const error = new Error('Floor ID is required.');
    error.status = 400;
    throw error;
  }

  const hasAccess = await authorization.hasHostelAccess(user, hostel_id);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to manage this hostel.');
    error.status = 403;
    throw error;
  }

  // Cross-hostel validation: verify floor belongs to selected hostel
  const [floorRow] = await db.pool.query(
    'SELECT hostel_id FROM floors WHERE id = ?',
    [floor_id]
  );
  if (floorRow.length === 0) {
    const error = new Error('Selected floor does not exist.');
    error.status = 400;
    throw error;
  }
  if (floorRow[0].hostel_id !== parseInt(hostel_id, 10)) {
    const error = new Error('Selected floor does not belong to the selected hostel.');
    error.status = 400;
    throw error;
  }

  if (!room_number || !room_number.trim()) {
    const error = new Error('Room number is required.');
    error.status = 400;
    throw error;
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    const error = new Error('Capacity must be a positive integer.');
    error.status = 400;
    throw error;
  }

  if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints (room_number unique in the same hostel)
  const [duplicateRoom] = await db.pool.query(
    'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ?',
    [hostel_id, room_number.trim()]
  );
  if (duplicateRoom.length > 0) {
    const error = new Error(`Room number "${room_number}" already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query(
    'INSERT INTO rooms (hostel_id, floor_id, room_number, capacity, status) VALUES (?, ?, ?, ?, ?)',
    [hostel_id, floor_id, room_number.trim(), parsedCapacity, status]
  );

  return { id: result.insertId, hostel_id, floor_id, room_number, capacity: parsedCapacity, status };
};

/**
 * Updates an existing room.
 */
const updateRoom = async (roomId, roomData, user) => {
  const { hostel_id, floor_id, room_number, capacity, status } = roomData;

  const currentRoom = await getRoomById(roomId, user);
  const oldHostelId = currentRoom.hostel_id;
  const targetHostelId = hostel_id ? parseInt(hostel_id, 10) : oldHostelId;

  // Verify access to both old and new hostel (if changing)
  const hasAccessOld = await authorization.hasHostelAccess(user, oldHostelId);
  const hasAccessNew = await authorization.hasHostelAccess(user, targetHostelId);
  if (!hasAccessOld || !hasAccessNew) {
    const error = new Error('Forbidden: You do not have access to manage rooms in this hostel.');
    error.status = 403;
    throw error;
  }

  const targetFloorId = floor_id ? parseInt(floor_id, 10) : currentRoom.floor_id;

  // Cross-hostel validation: verify floor belongs to target hostel
  const [floorRow] = await db.pool.query(
    'SELECT hostel_id FROM floors WHERE id = ?',
    [targetFloorId]
  );
  if (floorRow.length === 0) {
    const error = new Error('Selected floor does not exist.');
    error.status = 400;
    throw error;
  }
  if (floorRow[0].hostel_id !== targetHostelId) {
    const error = new Error('Selected floor does not belong to the selected hostel.');
    error.status = 400;
    throw error;
  }

  if (!room_number || !room_number.trim()) {
    const error = new Error('Room number is required.');
    error.status = 400;
    throw error;
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    const error = new Error('Capacity must be a positive integer.');
    error.status = 400;
    throw error;
  }

  if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints (excluding current ID)
  const [duplicateRoom] = await db.pool.query(
    'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ? AND id != ?',
    [targetHostelId, room_number.trim(), roomId]
  );
  if (duplicateRoom.length > 0) {
    const error = new Error(`Room number "${room_number}" already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  // Capacity safety check: check if there are more existing beds than the new capacity
  const [bedsCountRow] = await db.pool.query(
    'SELECT COUNT(*) as count FROM beds WHERE room_id = ?',
    [roomId]
  );
  const existingBedsCount = bedsCountRow[0].count;
  if (parsedCapacity < existingBedsCount) {
    const error = new Error(`Cannot decrease capacity to ${parsedCapacity}: There are already ${existingBedsCount} beds configured in this room.`);
    error.status = 400;
    throw error;
  }

  await db.pool.query(
    'UPDATE rooms SET hostel_id = ?, floor_id = ?, room_number = ?, capacity = ?, status = ? WHERE id = ?',
    [targetHostelId, targetFloorId, room_number.trim(), parsedCapacity, status, roomId]
  );

  return { id: roomId, hostel_id: targetHostelId, floor_id: targetFloorId, room_number, capacity: parsedCapacity, status };
};

/**
 * Safely deletes a room.
 */
const deleteRoom = async (roomId, user) => {
  // Check permission
  const hasAccess = await authorization.hasRoomAccess(user, roomId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this room.');
    error.status = 403;
    throw error;
  }

  // Check if room contains beds
  const [beds] = await db.pool.query('SELECT id FROM beds WHERE room_id = ? LIMIT 1', [roomId]);
  if (beds.length > 0) {
    const error = new Error('Cannot delete room: It contains active beds. Remove beds first.');
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query('DELETE FROM rooms WHERE id = ?', [roomId]);
  if (result.affectedRows === 0) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }

  return { success: true };
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
