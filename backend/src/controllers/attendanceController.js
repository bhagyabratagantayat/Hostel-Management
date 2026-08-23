const attendanceService = require('../services/attendanceService');
// const { validationResult } = require('express-validator'); // removed unused dependency

/**
 * GET /api/attendance/hostel/:hostelId?date=YYYY-MM-DD
 */
async function getHostelAttendance(req, res) {
  try {
    const hostelId = Number(req.params.hostelId);
    const date = req.query.date;
    const data = await attendanceService.getHostelAttendance(hostelId, date, req.user);
    res.json({ success: true, attendance: data });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * GET /api/attendance/student/:studentId
 */
async function getStudentAttendance(req, res) {
  try {
    const studentId = Number(req.params.studentId);
    const data = await attendanceService.getStudentAttendance(studentId, req.user);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * POST /api/attendance/bulk
 * Body: { date: 'YYYY-MM-DD', records: [{ studentId, status }] }
 */
async function bulkMark(req, res) {
  try {
    // Simple validation – in a real project you'd use express-validator middleware
    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    await attendanceService.bulkMark(date, records, req.user);
    res.json({ success: true, message: 'Attendance recorded' });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * PUT /api/attendance/:id
 */
async function updateAttendance(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['PRESENT', 'ABSENT'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await attendanceService.updateAttendance(id, status, req.user);
    res.json({ success: true, message: 'Attendance updated' });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * GET /api/attendance/hostel/:hostelId/summary?date=YYYY-MM-DD
 */
async function getHostelSummary(req, res) {
  try {
    const hostelId = Number(req.params.hostelId);
    const date = req.query.date;
    const data = await attendanceService.getHostelSummary(hostelId, date, req.user);
    res.json({ success: true, summary: data });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
}

module.exports = {
  getHostelAttendance,
  getStudentAttendance,
  bulkMark,
  updateAttendance,
  getHostelSummary
};
