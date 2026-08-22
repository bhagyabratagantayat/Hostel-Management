const db = require('../config/db');

const getAllHostels = async (req, res, next) => {
  try {
    const [rows] = await db.pool.query(
      'SELECT id, name, code, gender, location, status FROM hostels WHERE status = "ACTIVE" ORDER BY id ASC'
    );
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
