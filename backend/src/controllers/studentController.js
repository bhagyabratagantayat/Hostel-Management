const db = require('../config/db');
const authUtil = require('../utils/authorization');

/**
 * Get student profile by ID with strict role-based ownership checks.
 */
const getStudentById = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id);

    // 1. Reusable Security check
    const isAuthorized = await authUtil.hasStudentAccess(req.user, studentId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this student record.'
      });
    }

    // 2. Query Student details
    const [students] = await db.pool.query(
      `SELECT s.*, u.username, u.email as user_email, 
              b.bed_number, r.room_number, h.name as hostel_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN beds b ON s.bed_id = b.id
       LEFT JOIN rooms r ON b.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: students[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper endpoint to retrieve the current logged-in student profile.
 */
const getMyProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'Bad Request: Only students have individual student profiles.'
      });
    }

    const [students] = await db.pool.query(
      `SELECT s.*, u.username, u.email as user_email, 
              b.bed_number, r.room_number, h.name as hostel_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN beds b ON s.bed_id = b.id
       LEFT JOIN rooms r ON b.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile details not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: students[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentById,
  getMyProfile
};
