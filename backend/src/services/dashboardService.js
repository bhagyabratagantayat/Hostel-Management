const db = require('../config/db');
const { hasHostelAccess, hasStudentAccess, getAssignedHostels } = require('../utils/authorization');

/**
 * Build dashboard overview aggregation based on user role.
 * Returns an object { overall: {...}, hostels: [{...}] }
 */
async function getDashboardOverview(user) {
  if (!user) throw new Error('Unauthenticated');

  // Determine scope: for SUPER_ADMIN all hostels, for SUPERINTENDENT only assigned
  let allowedHostelIds = null; // null => all
  if (user.role === 'SUPERINTENDENT') {
    const assigned = await getAssignedHostels(user.id);
    allowedHostelIds = assigned.length ? assigned : [];
  } else if (user.role !== 'SUPER_ADMIN') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  // Helper to format date as YYYY-MM-DD (local server timezone)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Base queries (no hostel filter)
  const [hostelCountRows] = await db.pool.query('SELECT COUNT(*) AS totalHostels FROM hostels');
  const [studentCountRows] = await db.pool.query("SELECT COUNT(*) AS totalStudents FROM students WHERE status = 'ACTIVE'");
  const [roomCountRows] = await db.pool.query('SELECT COUNT(*) AS totalRooms FROM rooms');
  const [bedCounts] = await db.pool.query('SELECT COUNT(*) AS totalBeds, SUM(status = \'OCCUPIED\') AS occupiedBeds, SUM(status = \'AVAILABLE\') AS availableBeds, SUM(status = \'MAINTENANCE\') AS maintenanceBeds FROM beds');

  const [presentRows] = await db.pool.query('SELECT COUNT(*) AS present FROM attendance WHERE attendance_date = ? AND status = \'PRESENT\'', [todayStr]);
  const [absentRows] = await db.pool.query('SELECT COUNT(*) AS absent FROM attendance WHERE attendance_date = ? AND status = \'ABSENT\'', [todayStr]);

  // Active students in scope (for not marked calculation)
  let activeStudentIds = [];
  if (allowedHostelIds === null) {
    const [students] = await db.pool.query("SELECT s.id FROM students s WHERE s.status = 'ACTIVE'");
    activeStudentIds = students.map(s => s.id);
  } else if (allowedHostelIds.length) {
    const placeholders = allowedHostelIds.map(() => '?').join(',');
    const [students] = await db.pool.query(
      `SELECT s.id FROM students s
       JOIN beds b ON s.bed_id = b.id
       JOIN rooms r ON b.room_id = r.id
       WHERE s.status = 'ACTIVE' AND r.hostel_id IN (${placeholders})`,
      allowedHostelIds
    );
    activeStudentIds = students.map(s => s.id);
  }

  // Attendance records for today for students in scope
  let markedStudentIds = [];
  if (activeStudentIds.length) {
    const placeholders = activeStudentIds.map(() => '?').join(',');
    const [attRows] = await db.pool.query(
      `SELECT DISTINCT student_id FROM attendance WHERE attendance_date = ? AND student_id IN (${placeholders})`,
      [todayStr, ...activeStudentIds]
    );
    markedStudentIds = attRows.map(r => r.student_id);
  }
  const notMarkedCount = activeStudentIds.length - markedStudentIds.length;

  const present = presentRows[0].present || 0;
  const absent = absentRows[0].absent || 0;
  const totalMarked = present + absent;
  const attendancePercentage = totalMarked ? Math.round((present / totalMarked) * 100) : 0;
  const occupancyPercentage = (bedCounts[0].occupiedBeds + bedCounts[0].availableBeds) ? Math.round((bedCounts[0].occupiedBeds / (bedCounts[0].occupiedBeds + bedCounts[0].availableBeds)) * 100) : 0;

  const overall = {
    totalHostels: hostelCountRows[0].totalHostels,
    totalStudents: studentCountRows[0].totalStudents,
    totalRooms: roomCountRows[0].totalRooms,
    totalBeds: bedCounts[0].totalBeds,
    occupiedBeds: bedCounts[0].occupiedBeds,
    availableBeds: bedCounts[0].availableBeds,
    maintenanceBeds: bedCounts[0].maintenanceBeds,
    present,
    absent,
    notMarked: notMarkedCount,
    attendancePercentage,
    occupancyPercentage
  };

  // Hostels aggregation (if needed)
  const hostelIdsQuery = allowedHostelIds === null ? 'SELECT id FROM hostels' : `SELECT id FROM hostels WHERE id IN (${allowedHostelIds.map(() => '?').join(',')})`;
  const hostelIdsParams = allowedHostelIds === null ? [] : allowedHostelIds;
  const [hostelRows] = await db.pool.query(hostelIdsQuery, hostelIdsParams);

  const hostels = [];
  for (const h of hostelRows) {
    const hostelId = h.id;
    const [hNameRows] = await db.pool.query('SELECT name FROM hostels WHERE id = ?', [hostelId]);
    const name = hNameRows[0].name;
    // Students per hostel
    const [stuRows] = await db.pool.query(
      `SELECT COUNT(*) AS totalStudents FROM students s
       JOIN beds b ON s.bed_id = b.id
       JOIN rooms r ON b.room_id = r.id
       WHERE s.status = 'ACTIVE' AND r.hostel_id = ?`,
      [hostelId]
    );
    const totalStudents = stuRows[0].totalStudents;
    // Attendance per hostel today
    const [attStuRows] = await db.pool.query(
      `SELECT SUM(a.status = 'PRESENT') AS present, SUM(a.status = 'ABSENT') AS absent FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN beds b ON s.bed_id = b.id
       JOIN rooms r ON b.room_id = r.id
       WHERE a.attendance_date = ? AND r.hostel_id = ?`,
      [todayStr, hostelId]
    );
    const presentH = attStuRows[0].present || 0;
    const absentH = attStuRows[0].absent || 0;
    const markedH = presentH + absentH;
    const notMarkedH = totalStudents - markedH;
    const attendancePct = markedH ? Math.round((presentH / markedH) * 100) : 0;
    // Beds per hostel
    const [bedRows] = await db.pool.query(
      `SELECT COUNT(*) AS totalBeds,
              SUM(status = 'OCCUPIED') AS occupiedBeds,
              SUM(status = 'AVAILABLE') AS availableBeds,
              SUM(status = 'MAINTENANCE') AS maintenanceBeds
       FROM beds b
       JOIN rooms r ON b.room_id = r.id
       WHERE r.hostel_id = ?`,
      [hostelId]
    );
    const totalBeds = bedRows[0].totalBeds;
    const occupiedBeds = bedRows[0].occupiedBeds;
    const availableBeds = bedRows[0].availableBeds;
    const maintenanceBeds = bedRows[0].maintenanceBeds;
    const occupancyPct = (occupiedBeds + availableBeds) ? Math.round((occupiedBeds / (occupiedBeds + availableBeds)) * 100) : 0;

    hostels.push({
      hostelId,
      name,
      totalStudents,
      present: presentH,
      absent: absentH,
      notMarked: notMarkedH,
      attendancePercentage: attendancePct,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyPercentage: occupancyPct
    });
  }

  return { overall, hostels };
}

module.exports = { getDashboardOverview };
