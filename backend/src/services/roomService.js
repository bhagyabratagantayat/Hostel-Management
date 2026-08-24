const db = require('../config/db');
const authorization = require('../utils/authorization');
const masterService = require('./masterService');
const activityService = require('./activityService');

/**
 * Retrieves all rooms based on filters, permissions, pagination, and search.
 */
const getAllRooms = async (filters, user) => {
  const { hostel_id, floor_id, search, status, page = 1, limit = 20 } = filters || {};
  const { id: userId, role } = user;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT r.*, h.name as hostel_name, f.floor_name 
    FROM rooms r
    JOIN hostels h ON r.hostel_id = h.id
    JOIN floors f ON r.floor_id = f.id
  `;
  let countQuery = `
    SELECT COUNT(*) as total
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
      const assigned = user.assignedHostels || [];
      if (assigned.length === 0) return { data: [], pagination: { page: pageNum, limit: limitNum, totalPages: 0, totalItems: 0 } };
      conditions.push('r.hostel_id IN (?)');
      queryParams.push(assigned);
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

  if (status) {
    conditions.push('r.status = ?');
    queryParams.push(status);
  }

  if (search && search.trim()) {
    conditions.push('(r.room_number LIKE ? OR f.floor_name LIKE ? OR h.name LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const [countRows] = await db.pool.query(countQuery + whereSql, queryParams);
  const totalItems = countRows[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / limitNum);

  query += whereSql + ' ORDER BY r.hostel_id ASC, r.floor_id ASC, r.room_number ASC LIMIT ? OFFSET ?';
  const [rows] = await db.pool.query(query, [...queryParams, limitNum, offset]);

  return {
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalItems
    }
  };
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
 * Creates a new room (Super Admin only).
 */
const createRoom = async (roomData, user) => {
  masterService.assertSuperAdmin(user);

  const { hostel_id, floor_id, room_number, capacity, status = 'ACTIVE' } = roomData;

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

  const [floorRow] = await db.pool.query(
    'SELECT hostel_id FROM floors WHERE id = ?',
    [floor_id]
  );
  if (floorRow.length === 0) {
    const error = new Error('Selected floor does not exist.');
    error.status = 400;
    throw error;
  }
  if (parseInt(floorRow[0].hostel_id, 10) !== parseInt(hostel_id, 10)) {
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

  const [duplicateRoom] = await db.pool.query(
    'SELECT id FROM rooms WHERE floor_id = ? AND room_number = ?',
    [floor_id, room_number.trim()]
  );
  if (duplicateRoom.length > 0) {
    const error = new Error(`Room number "${room_number}" already exists in this floor.`);
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query(
    'INSERT INTO rooms (hostel_id, floor_id, room_number, capacity, status) VALUES (?, ?, ?, ?, ?)',
    [hostel_id, floor_id, room_number.trim(), parsedCapacity, status]
  );

  const createdRoom = { id: result.insertId, hostel_id, floor_id, room_number: room_number.trim(), capacity: parsedCapacity, status };

  await activityService.logActivity({
    actorId: user.id,
    action: 'ROOM_CREATED',
    module: 'MASTER_DATA',
    entityType: 'ROOM',
    entityId: result.insertId,
    hostelId: hostel_id,
    description: `Created room "${room_number.trim()}" (Capacity: ${parsedCapacity})`,
    metadata: createdRoom
  });

  return createdRoom;
};

/**
 * Updates an existing room (Super Admin only).
 */
const updateRoom = async (roomId, roomData, user) => {
  masterService.assertSuperAdmin(user);

  const { hostel_id, floor_id, room_number, capacity, status } = roomData;

  const currentRoom = await getRoomById(roomId, user);
  const targetHostelId = hostel_id ? parseInt(hostel_id, 10) : currentRoom.hostel_id;
  const targetFloorId = floor_id ? parseInt(floor_id, 10) : currentRoom.floor_id;

  if (status === 'INACTIVE') {
    await masterService.validateRoomDeactivation(roomId);
  }

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

  const [duplicateRoom] = await db.pool.query(
    'SELECT id FROM rooms WHERE floor_id = ? AND room_number = ? AND id != ?',
    [targetFloorId, room_number.trim(), roomId]
  );
  if (duplicateRoom.length > 0) {
    const error = new Error(`Room number "${room_number}" already exists in this floor.`);
    error.status = 400;
    throw error;
  }

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

  const action = status === 'INACTIVE' ? 'ROOM_DEACTIVATED' : 'ROOM_UPDATED';

  await activityService.logActivity({
    actorId: user.id,
    action,
    module: 'MASTER_DATA',
    entityType: 'ROOM',
    entityId: roomId,
    hostelId: targetHostelId,
    description: `Updated room "${room_number.trim()}" status to ${status}`,
    metadata: { id: roomId, hostel_id: targetHostelId, floor_id: targetFloorId, room_number: room_number.trim(), capacity: parsedCapacity, status }
  });

  return { id: roomId, hostel_id: targetHostelId, floor_id: targetFloorId, room_number: room_number.trim(), capacity: parsedCapacity, status };
};

/**
 * Safely deletes a room (Super Admin only).
 */
const deleteRoom = async (roomId, user) => {
  masterService.assertSuperAdmin(user);

  await masterService.validateRoomDeactivation(roomId);

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

