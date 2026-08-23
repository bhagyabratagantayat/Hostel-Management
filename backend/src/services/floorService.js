const db = require('../config/db');
const authorization = require('../utils/authorization');

/**
 * Retrieves all floors based on filters and permissions.
 */
const getAllFloors = async (filters, user) => {
  const { hostel_id } = filters;
  const { id: userId, role } = user;

  let query = 'SELECT f.*, h.name as hostel_name FROM floors f JOIN hostels h ON f.hostel_id = h.id';
  let queryParams = [];

  if (hostel_id) {
    const hasAccess = await authorization.hasHostelAccess(user, hostel_id);
    if (!hasAccess) {
      const error = new Error('Forbidden: You do not have access to this hostel\'s floors.');
      error.status = 403;
      throw error;
    }
    query += ' WHERE f.hostel_id = ?';
    queryParams = [hostel_id];
  } else {
    if (role === 'SUPERINTENDENT') {
      const assigned = await authorization.getAssignedHostels(userId);
      if (assigned.length === 0) return [];
      query += ' WHERE f.hostel_id IN (?)';
      queryParams = [assigned];
    } else if (role === 'STUDENT') {
      const error = new Error('Forbidden: Students cannot access floor listings.');
      error.status = 403;
      throw error;
    }
  }

  query += ' ORDER BY f.hostel_id ASC, f.floor_number ASC';
  const [rows] = await db.pool.query(query, queryParams);
  return rows;
};

/**
 * Retrieves a single floor by ID.
 */
const getFloorById = async (floorId, user) => {
  const hasAccess = await authorization.hasFloorAccess(user, floorId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this floor.');
    error.status = 403;
    throw error;
  }

  const [rows] = await db.pool.query(
    'SELECT f.*, h.name as hostel_name FROM floors f JOIN hostels h ON f.hostel_id = h.id WHERE f.id = ?',
    [floorId]
  );
  if (rows.length === 0) {
    const error = new Error('Floor not found.');
    error.status = 404;
    throw error;
  }
  return rows[0];
};

/**
 * Creates a new floor.
 */
const createFloor = async (floorData, user) => {
  const { hostel_id, floor_name, floor_number, status } = floorData;

  if (!hostel_id) {
    const error = new Error('Hostel ID is required.');
    error.status = 400;
    throw error;
  }

  const hasAccess = await authorization.hasHostelAccess(user, hostel_id);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to manage this hostel.');
    error.status = 403;
    throw error;
  }

  if (!floor_name || !floor_name.trim()) {
    const error = new Error('Floor name is required.');
    error.status = 400;
    throw error;
  }

  if (floor_number === undefined || isNaN(parseInt(floor_number, 10))) {
    const error = new Error('Valid floor number is required.');
    error.status = 400;
    throw error;
  }

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints (floor_number unique in the same hostel)
  const [duplicateNumber] = await db.pool.query(
    'SELECT id FROM floors WHERE hostel_id = ? AND floor_number = ?',
    [hostel_id, floor_number]
  );
  if (duplicateNumber.length > 0) {
    const error = new Error(`Floor number ${floor_number} already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  // Also check if floor_name already exists in this hostel
  const [duplicateName] = await db.pool.query(
    'SELECT id FROM floors WHERE hostel_id = ? AND floor_name = ?',
    [hostel_id, floor_name.trim()]
  );
  if (duplicateName.length > 0) {
    const error = new Error(`Floor name "${floor_name}" already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query(
    'INSERT INTO floors (hostel_id, floor_name, floor_number, status) VALUES (?, ?, ?, ?)',
    [hostel_id, floor_name.trim(), parseInt(floor_number, 10), status]
  );

  return { id: result.insertId, hostel_id, floor_name, floor_number, status };
};

/**
 * Updates an existing floor.
 */
const updateFloor = async (floorId, floorData, user) => {
  const { floor_name, floor_number, status } = floorData;

  const currentFloor = await getFloorById(floorId, user);
  const hostel_id = currentFloor.hostel_id;

  if (!floor_name || !floor_name.trim()) {
    const error = new Error('Floor name is required.');
    error.status = 400;
    throw error;
  }

  if (floor_number === undefined || isNaN(parseInt(floor_number, 10))) {
    const error = new Error('Valid floor number is required.');
    error.status = 400;
    throw error;
  }

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Invalid status specification.');
    error.status = 400;
    throw error;
  }

  // Check unique constraints (excluding current ID)
  const [duplicateNumber] = await db.pool.query(
    'SELECT id FROM floors WHERE hostel_id = ? AND floor_number = ? AND id != ?',
    [hostel_id, floor_number, floorId]
  );
  if (duplicateNumber.length > 0) {
    const error = new Error(`Floor number ${floor_number} already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  const [duplicateName] = await db.pool.query(
    'SELECT id FROM floors WHERE hostel_id = ? AND floor_name = ? AND id != ?',
    [hostel_id, floor_name.trim(), floorId]
  );
  if (duplicateName.length > 0) {
    const error = new Error(`Floor name "${floor_name}" already exists in this hostel.`);
    error.status = 400;
    throw error;
  }

  await db.pool.query(
    'UPDATE floors SET floor_name = ?, floor_number = ?, status = ? WHERE id = ?',
    [floor_name.trim(), parseInt(floor_number, 10), status, floorId]
  );

  return { id: floorId, hostel_id, floor_name, floor_number, status };
};

/**
 * Safely deletes a floor.
 */
const deleteFloor = async (floorId, user) => {
  // Check permission
  const hasAccess = await authorization.hasFloorAccess(user, floorId);
  if (!hasAccess) {
    const error = new Error('Forbidden: You do not have access to this floor.');
    error.status = 403;
    throw error;
  }

  // Check if floor contains rooms
  const [rooms] = await db.pool.query('SELECT id FROM rooms WHERE floor_id = ? LIMIT 1', [floorId]);
  if (rooms.length > 0) {
    const error = new Error('Cannot delete floor: It has active rooms configured. Remove rooms first.');
    error.status = 400;
    throw error;
  }

  const [result] = await db.pool.query('DELETE FROM floors WHERE id = ?', [floorId]);
  if (result.affectedRows === 0) {
    const error = new Error('Floor not found.');
    error.status = 404;
    throw error;
  }

  return { success: true };
};

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
};
