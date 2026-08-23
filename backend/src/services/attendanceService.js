const db = require('../config/db');
const { hasHostelAccess, hasStudentAccess } = require('../utils/authorization');
const activityService = require('./activityService');

/**
 * Bulk mark attendance for a given date.
 * @param {string} date - YYYY-MM-DD attendance date.
 * @param {Array<{studentId:number,status:'PRESENT'|'ABSENT'}>} records
 * @param {object} user - Authenticated user { id, role }
 * @returns {Promise<void>}
 */
async function bulkMark(date, records, user) {
  if (!date || !records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Invalid attendance payload');
  }

  // Validate date format (basic regex, ensures YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid attendance date format');
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // Gather student IDs for permission check in bulk
    const studentIds = records.map(r => r.studentId);
    const [students] = await connection.query(
      `SELECT s.id, s.bed_id, b.id AS bedId, r.hostel_id FROM students s
       LEFT JOIN beds b ON s.bed_id = b.id
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE s.id IN (?)`,
      [studentIds]
    );

    // Ensure every student exists and belongs to a hostel the user may act on
    for (const rec of records) {
      const stu = students.find(s => s.id === rec.studentId);
      if (!stu) {
        throw new Error(`Student with ID ${rec.studentId} not found`);
      }
      // Determine the hostel based on the student's current assignment (or NULL)
      const hostelId = stu.hostel_id;
      if (!hostelId) {
        throw new Error(`Student ${rec.studentId} is not assigned to a hostel`);
      }
      const allowed = await hasHostelAccess(user, hostelId);
      if (!allowed) {
        throw new Error('Unauthorized to mark attendance for one or more students');
      }
    }

    // Upsert each attendance record using INSERT ... ON DUPLICATE KEY UPDATE
    const insertValues = records.map(rec => {
      const stu = students.find(s => s.id === rec.studentId);
      const hostelId = stu.hostel_id;
      return [rec.studentId, hostelId, date, rec.status, user.id];
    });

    const placeholders = insertValues.map(() => '(?,?,?,?,?)').join(',');
    const flatValues = insertValues.flat();

    const sql = `INSERT INTO attendance (student_id, hostel_id, attendance_date, status, marked_by)
                 VALUES ${placeholders}
                 ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), marked_at = CURRENT_TIMESTAMP`;

    await connection.query(sql, flatValues);

    const firstStudent = students[0];
    const hostelId = firstStudent ? firstStudent.hostel_id : null;
    await activityService.logActivity({
      actorId: user.id,
      action: 'ATTENDANCE_MARKED',
      module: 'ATTENDANCE',
      entityType: 'ATTENDANCE',
      hostelId: hostelId,
      description: `Marked daily attendance for ${records.length} student(s) on ${date}`,
      metadata: { count: records.length, date }
    }, connection);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Retrieve attendance for a hostel on a specific date.
 * Returns enriched student data for UI consumption.
 */
async function getHostelAttendance(hostelId, date, user) {
  if (!await hasHostelAccess(user, hostelId)) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  const sql = `SELECT a.id AS attendanceId, a.status, a.marked_by, a.marked_at,
                      s.id AS studentId, s.full_name, s.photo_url, s.roll_number,
                      s.branch, s.year, s.semester,
                      r.room_number, b.bed_number
               FROM students s
               LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ?
               LEFT JOIN beds b ON s.bed_id = b.id
               LEFT JOIN rooms r ON b.room_id = r.id
               WHERE r.hostel_id = ?`;
  const [rows] = await db.pool.query(sql, [date, hostelId]);
  return rows;
}

/**
 * Retrieve attendance history for a student.
 */
async function getStudentAttendance(studentId, user) {
  if (!await hasStudentAccess(user, studentId)) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  const sql = `SELECT attendance_date AS date, status, marked_by, marked_at
               FROM attendance
               WHERE student_id = ?
               ORDER BY attendance_date DESC`;
  const [rows] = await db.pool.query(sql, [studentId]);
  // Compute summary statistics
  const totalMarked = rows.length;
  const present = rows.filter(r => r.status === 'PRESENT').length;
  const absent = rows.filter(r => r.status === 'ABSENT').length;
  const percentage = totalMarked ? Math.round((present / totalMarked) * 100) : 0;
  return { history: rows, summary: { totalMarked, present, absent, percentage } };
}

/**
 * Update a single attendance entry (used for editing).
 */
async function updateAttendance(id, status, user) {
  // Fetch existing record to verify permission & hostel scope
  const [rows] = await db.pool.query('SELECT * FROM attendance WHERE id = ?', [id]);
  if (rows.length === 0) {
    const err = new Error('Attendance record not found');
    err.status = 404;
    throw err;
  }
  const record = rows[0];
  if (!await hasHostelAccess(user, record.hostel_id)) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  // Only SUPER_ADMIN or the superintendent of that hostel may edit
  await db.pool.query('UPDATE attendance SET status = ?, marked_by = ?, marked_at = CURRENT_TIMESTAMP WHERE id = ?', [status, user.id, id]);
}

/**
 * Summary statistics for a hostel (optional, used by UI).
 */
async function getHostelSummary(hostelId, date, user) {
  if (!await hasHostelAccess(user, hostelId)) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  const sql = `SELECT COUNT(s.id) AS totalStudents,
                      SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
                      SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
                      SUM(CASE WHEN a.id IS NULL THEN 1 ELSE 0 END) AS notMarked
               FROM students s
               LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ?
               LEFT JOIN beds b ON s.bed_id = b.id
               LEFT JOIN rooms r ON b.room_id = r.id
               WHERE r.hostel_id = ?`;
  const [rows] = await db.pool.query(sql, [date, hostelId]);
  const row = rows[0];
  const percentage = row.present + row.absent ? Math.round((row.present / (row.present + row.absent)) * 100) : 0;
  return { ...row, percentage };
}

module.exports = {
  bulkMark,
  getHostelAttendance,
  getStudentAttendance,
  updateAttendance,
  getHostelSummary
};
