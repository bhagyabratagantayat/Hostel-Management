const db = require('../config/db');

/**
 * Retrieves hostels list, filtered dynamically by the requesting user's role and assignments.
 */
const getAllHostels = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    let query = '';
    let queryParams = [];

    if (role === 'SUPER_ADMIN') {
      // Admins can see all active hostels
      query = 'SELECT id, name, code, gender, location, status FROM hostels WHERE status = "ACTIVE" ORDER BY id ASC';
    } 
    else if (role === 'SUPERINTENDENT') {
      // Superintendents can only see hostels they are assigned to
      query = `
        SELECT h.id, h.name, h.code, h.gender, h.location, h.status 
        FROM hostels h
        JOIN superintendent_hostels sh ON h.id = sh.hostel_id
        WHERE sh.user_id = ? AND h.status = "ACTIVE"
        ORDER BY h.id ASC
      `;
      queryParams = [userId];
    } 
    else if (role === 'STUDENT') {
      // Students can only see their own assigned hostel
      query = `
        SELECT h.id, h.name, h.code, h.gender, h.location, h.status 
        FROM hostels h
        JOIN rooms r ON h.id = r.hostel_id
        JOIN beds b ON r.id = b.room_id
        JOIN students s ON b.id = s.bed_id
        WHERE s.user_id = ? AND h.status = "ACTIVE"
      `;
      queryParams = [userId];
    } 
    else {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Unknown user role.'
      });
    }

    const [rows] = await db.pool.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllHostels
};
