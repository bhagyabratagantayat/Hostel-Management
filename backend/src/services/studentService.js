const db = require('../config/db');
const authorization = require('../utils/authorization');
const passwordUtil = require('../utils/password');
const cloudinary = require('../config/cloudinary');

/**
 * Helper to upload profile photo to Cloudinary.
 * Falls back to mock response if Cloudinary is not configured or in test environments.
 */
const uploadProfilePhoto = async (base64Data) => {
  if (!base64Data) return null;

  // Basic validation of base64 image prefix
  const match = base64Data.match(/^data:image\/(\w+);base64,/);
  if (!match) {
    const error = new Error('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.');
    error.status = 400;
    throw error;
  }

  const extension = match[1].toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    const error = new Error('Unsupported file extension. Supported: JPG, JPEG, PNG, WEBP.');
    error.status = 400;
    throw error;
  }

  // Basic size validation (approx 5MB max)
  const sizeInBytes = Math.round((base64Data.length * 3) / 4);
  if (sizeInBytes > 5 * 1024 * 1024) {
    const error = new Error('File size exceeds the maximum limit of 5MB.');
    error.status = 400;
    throw error;
  }

  // Check if Cloudinary is fully configured
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary credentials not set. Falling back to mock image upload.');
    return {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
      public_id: 'mock_cloudinary_public_id_' + Date.now()
    };
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(base64Data, {
      folder: 'hostel_management/students',
      resource_type: 'image'
    });
    return {
      secure_url: uploadRes.secure_url,
      public_id: uploadRes.public_id
    };
  } catch (err) {
    const error = new Error(`Cloudinary upload failed: ${err.message}`);
    error.status = 500;
    throw error;
  }
};

/**
 * Helper to delete profile photo from Cloudinary.
 */
const deleteProfilePhoto = async (publicId) => {
  if (!publicId || publicId.startsWith('mock_cloudinary_')) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to delete Cloudinary photo ${publicId}:`, err);
  }
};

/**
 * Retrieves all students matching search queries and filters, role-scoped.
 */
const getAllStudents = async (filters = {}, user) => {
  const { role, id: userId } = user;
  const { page = 1, limit = 20, search = '', hostel_id, branch, course, year, status } = filters;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const queryParams = [];

  // Scoping based on user role
  if (role === 'SUPERINTENDENT') {
    const assignedHostels = await authorization.getAssignedHostels(userId);
    if (assignedHostels.length === 0) {
      return { students: [], currentPage: pageNum, totalPages: 0, totalStudents: 0, limit: limitNum };
    }

    if (hostel_id && hostel_id !== 'all') {
      if (!assignedHostels.includes(Number(hostel_id))) {
        const error = new Error('Forbidden: You do not have access to this hostel.');
        error.status = 403;
        throw error;
      }
      conditions.push('r.hostel_id = ?');
      queryParams.push(hostel_id);
    } else {
      conditions.push('r.hostel_id IN (?)');
      queryParams.push(assignedHostels);
    }
  } else if (role === 'SUPER_ADMIN') {
    if (hostel_id && hostel_id !== 'all') {
      conditions.push('r.hostel_id = ?');
      queryParams.push(hostel_id);
    }
  } else {
    const error = new Error('Forbidden: You do not have access to student records.');
    error.status = 403;
    throw error;
  }

  // Other filters
  if (branch) {
    conditions.push('s.branch = ?');
    queryParams.push(branch);
  }
  if (course) {
    conditions.push('s.course = ?');
    queryParams.push(course);
  }
  if (year) {
    conditions.push('s.year = ?');
    queryParams.push(parseInt(year, 10));
  }
  if (status) {
    conditions.push('s.status = ?');
    queryParams.push(status);
  }

  // Search term
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    conditions.push('(s.full_name LIKE ? OR s.student_id LIKE ? OR s.roll_number LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)');
    queryParams.push(term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN beds b ON s.bed_id = b.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN hostels h ON r.hostel_id = h.id
    ${whereClause}
  `;

  const [countResult] = await db.pool.query(countQuery, queryParams);
  const totalStudents = countResult && countResult[0] ? (countResult[0].total ?? countResult[0].cnt ?? (Array.isArray(countResult) ? countResult.length : 0)) : 0;
  const totalPages = Math.ceil(totalStudents / limitNum);

  // Get paginated student rows
  const selectQuery = `
    SELECT s.*, u.username, u.email as user_email, u.status as user_status,
           b.bed_number, r.room_number, r.id as room_id, f.floor_name, f.id as floor_id,
           h.name as hostel_name, h.id as hostel_id
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN beds b ON s.bed_id = b.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN floors f ON r.floor_id = f.id
    LEFT JOIN hostels h ON f.hostel_id = h.id
    ${whereClause}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `;

  // Note: we pass limit and offset as numbers explicitly to the mysql connection
  const [rows] = await db.pool.query(selectQuery, [...queryParams, limitNum, offset]);

  return {
    students: rows,
    currentPage: pageNum,
    totalPages,
    totalStudents,
    limit: limitNum
  };
};

/**
 * Retrieves a single student profile by ID.
 */
const getStudentById = async (studentId, user) => {
  const isAuthorized = await authorization.hasStudentAccess(user, studentId);
  if (!isAuthorized) {
    const error = new Error('Forbidden: You do not have permission to access this student record.');
    error.status = 403;
    throw error;
  }

  const [rows] = await db.pool.query(
    `SELECT s.*, u.username, u.email as user_email, u.status as user_status,
            b.bed_number, r.room_number, r.id as room_id, f.floor_name, f.id as floor_id,
            h.name as hostel_name, h.id as hostel_id
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN beds b ON s.bed_id = b.id
     LEFT JOIN rooms r ON b.room_id = r.id
     LEFT JOIN floors f ON r.floor_id = f.id
     LEFT JOIN hostels h ON f.hostel_id = h.id
     WHERE s.id = ?`,
    [studentId]
  );

  if (rows.length === 0) {
    const error = new Error('Student record not found.');
    error.status = 404;
    throw error;
  }

  return rows[0];
};

/**
 * Creates a new student user and profile in a transaction-safe manner.
 */
const createStudent = async (studentData, creator) => {
  const {
    student_id, roll_number, full_name, phone, email, branch, course, year, semester,
    hostel_id, floor_id, room_id, bed_id, admission_date, password, base64Photo
  } = studentData;

  // 1. Inputs validation
  if (!student_id || !student_id.trim()) {
    const error = new Error('Student ID is required.');
    error.status = 400;
    throw error;
  }
  if (!roll_number || !roll_number.trim()) {
    const error = new Error('Roll number is required.');
    error.status = 400;
    throw error;
  }
  if (!full_name || !full_name.trim()) {
    const error = new Error('Full name is required.');
    error.status = 400;
    throw error;
  }
  if (!email || !email.trim()) {
    const error = new Error('Email is required.');
    error.status = 400;
    throw error;
  }
  if (!password || password.trim().length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.status = 400;
    throw error;
  }
  if (!hostel_id || !room_id || !bed_id) {
    const error = new Error('Complete hostel, room, and bed assignments are required.');
    error.status = 400;
    throw error;
  }

  // 2. Creator scope validation
  if (creator.role === 'SUPERINTENDENT') {
    const assigned = await authorization.getAssignedHostels(creator.id);
    if (!assigned.includes(Number(hostel_id))) {
      const error = new Error('Forbidden: You can only assign students to your assigned hostel(s).');
      error.status = 403;
      throw error;
    }
  }

  // 3. Unique Constraints checks
  const [existingUser] = await db.pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [student_id.trim(), email.trim()]
  );
  if (existingUser.length > 0) {
    const error = new Error('Student ID already exists.');
    error.status = 400;
    throw error;
  }

  const [existingStudentId] = await db.pool.query(
    'SELECT id FROM students WHERE student_id = ?',
    [student_id.trim()]
  );
  if (existingStudentId.length > 0) {
    const error = new Error('Student ID already exists.');
    error.status = 400;
    throw error;
  }

  const [existingRoll] = await db.pool.query(
    'SELECT id FROM students WHERE roll_number = ?',
    [roll_number.trim()]
  );
  if (existingRoll.length > 0) {
    const error = new Error('Roll number already exists.');
    error.status = 400;
    throw error;
  }

  const [existingEmail] = await db.pool.query(
    'SELECT id FROM students WHERE email = ?',
    [email.trim()]
  );
  if (existingEmail.length > 0) {
    const error = new Error('Email already exists.');
    error.status = 400;
    throw error;
  }

  // 4. Validate complete bed -> room -> hostel hierarchy
  const [bedStructure] = await db.pool.query(
    `SELECT b.id as bed_id, r.id as room_id, r.floor_id, r.hostel_id, b.status as bed_status
     FROM beds b
     JOIN rooms r ON b.room_id = r.id
     JOIN hostels h ON r.hostel_id = h.id
     WHERE b.id = ?`,
    [bed_id]
  );

  if (bedStructure.length === 0) {
    const error = new Error('Selected bed does not exist.');
    error.status = 400;
    throw error;
  }

  const bed = bedStructure[0];
  if (
    bed.room_id !== Number(room_id) ||
    bed.hostel_id !== Number(hostel_id) ||
    (floor_id && bed.floor_id && bed.floor_id !== Number(floor_id))
  ) {
    const error = new Error('Invalid assignment relationship: Bed does not belong to the selected room, floor, or hostel.');
    error.status = 400;
    throw error;
  }

  if (bed.bed_status !== 'AVAILABLE') {
    const error = new Error('Selected bed is not available.');
    error.status = 400;
    throw error;
  }

  // 5. Upload Profile Photo if provided
  let photoUrl = null;
  let cloudinaryPublicId = null;
  if (base64Photo) {
    const uploadRes = await uploadProfilePhoto(base64Photo);
    photoUrl = uploadRes.secure_url;
    cloudinaryPublicId = uploadRes.public_id;
  }

  // 6. DB Transaction Execution
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // A. Hash password
    const passwordHash = await passwordUtil.hashPassword(password);

    // B. Create account in users table (role_id 3 is STUDENT)
    const [userInsertResult] = await connection.query(
      `INSERT INTO users (role_id, username, email, password_hash, status) 
       VALUES (3, ?, ?, ?, 'ACTIVE')`,
      [student_id.trim(), email.trim(), passwordHash]
    );
    const newUserId = userInsertResult.insertId;

    // C. Create student record
    const [studentInsertResult] = await connection.query(
      `INSERT INTO students (
        user_id, student_id, roll_number, full_name, photo_url, cloudinary_public_id,
        phone, email, branch, course, year, semester, bed_id, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        newUserId, student_id.trim(), roll_number.trim(), full_name.trim(), photoUrl, cloudinaryPublicId,
        phone || '', email.trim(), branch || '', course || '', parseInt(year, 10), parseInt(semester, 10),
        bed_id, admission_date || new Date().toISOString().slice(0, 10)
      ]
    );

    // D. Update bed status to OCCUPIED
    await connection.query(
      "UPDATE beds SET status = 'OCCUPIED' WHERE id = ?",
      [bed_id]
    );

    await connection.commit();
    return { id: studentInsertResult.insertId, student_id, full_name, email };
  } catch (err) {
    await connection.rollback();
    // Clean up Cloudinary file if created
    if (cloudinaryPublicId) {
      await deleteProfilePhoto(cloudinaryPublicId);
    }
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Updates details of an existing student.
 */
const updateStudent = async (studentId, updateData, user) => {
  const isAuthorized = await authorization.hasStudentAccess(user, studentId);
  if (!isAuthorized) {
    const error = new Error('Forbidden: You do not have permission to edit this student.');
    error.status = 403;
    throw error;
  }

  const currentStudent = await getStudentById(studentId, user);

  const {
    full_name, phone, email, branch, course, year, semester, status, base64Photo
  } = updateData;

  // Validate email unique constraint if changing
  if (email && email.trim() !== currentStudent.email) {
    const [existingEmail] = await db.pool.query(
      'SELECT id FROM students WHERE email = ? AND id != ?',
      [email.trim(), studentId]
    );
    if (existingEmail.length > 0) {
      const error = new Error('Email already exists.');
      error.status = 400;
      throw error;
    }
  }

  // Upload new photo if provided
  let newPhotoUrl = currentStudent.photo_url;
  let newCloudinaryPublicId = currentStudent.cloudinary_public_id;
  let oldCloudinaryPublicId = null;

  if (base64Photo) {
    const uploadRes = await uploadProfilePhoto(base64Photo);
    newPhotoUrl = uploadRes.secure_url;
    newCloudinaryPublicId = uploadRes.public_id;
    oldCloudinaryPublicId = currentStudent.cloudinary_public_id;
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // A. Update student details
    await connection.query(
      `UPDATE students 
       SET full_name = ?, phone = ?, email = ?, branch = ?, course = ?, 
           year = ?, semester = ?, status = ?, photo_url = ?, cloudinary_public_id = ?
       WHERE id = ?`,
      [
        full_name ? full_name.trim() : currentStudent.full_name,
        phone !== undefined ? phone : currentStudent.phone,
        email ? email.trim() : currentStudent.email,
        branch !== undefined ? branch : currentStudent.branch,
        course !== undefined ? course : currentStudent.course,
        year !== undefined ? parseInt(year, 10) : currentStudent.year,
        semester !== undefined ? parseInt(semester, 10) : currentStudent.semester,
        status || currentStudent.status,
        newPhotoUrl,
        newCloudinaryPublicId,
        studentId
      ]
    );

    // B. Keep user account email in sync
    if (email && email.trim() !== currentStudent.email) {
      await connection.query(
        'UPDATE users SET email = ? WHERE id = ?',
        [email.trim(), currentStudent.user_id]
      );
    }

    // C. Keep user status in sync if student status is changing
    if (status && status !== currentStudent.status) {
      const userStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [userStatus, currentStudent.user_id]
      );

      // If student is deactivated, release their bed
      if (status !== 'ACTIVE' && currentStudent.bed_id) {
        await connection.query(
          "UPDATE beds SET status = 'AVAILABLE' WHERE id = ?",
          [currentStudent.bed_id]
        );
        await connection.query(
          "UPDATE students SET bed_id = NULL WHERE id = ?",
          [studentId]
        );
      }
    }

    await connection.commit();

    // Successfully saved! Clean up old image if replaced
    if (oldCloudinaryPublicId) {
      await deleteProfilePhoto(oldCloudinaryPublicId);
    }

    return { success: true };
  } catch (err) {
    await connection.rollback();
    // Clean up newly uploaded image on failure
    if (newCloudinaryPublicId && newCloudinaryPublicId !== currentStudent.cloudinary_public_id) {
      await deleteProfilePhoto(newCloudinaryPublicId);
    }
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Transfers a student's room / bed assignment in a transaction-safe manner.
 */
const transferStudent = async (studentId, transferData, user) => {
  const { new_hostel_id, new_floor_id, new_room_id, new_bed_id } = transferData;

  if (!new_hostel_id || !new_room_id || !new_bed_id) {
    const error = new Error('Complete destination hostel, room, and bed assignments are required.');
    error.status = 400;
    throw error;
  }

  // 1. Authorize current access
  const isAuthorized = await authorization.hasStudentAccess(user, studentId);
  if (!isAuthorized) {
    const error = new Error('Forbidden: You do not have permission to transfer this student.');
    error.status = 403;
    throw error;
  }

  // 2. Validate transfer destination scope limits
  if (user.role === 'SUPERINTENDENT') {
    const assigned = await authorization.getAssignedHostels(user.id);
    if (!assigned.includes(Number(new_hostel_id))) {
      const error = new Error('Forbidden: You can only transfer students to your assigned hostel(s).');
      error.status = 403;
      throw error;
    }

    // Must also make sure student is currently in one of their assigned hostels
    const [rows] = await db.pool.query(
      `SELECT r.hostel_id FROM students s
       LEFT JOIN beds b ON s.bed_id = b.id
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE s.id = ?`,
      [studentId]
    );
    if (rows.length === 0 || !assigned.includes(Number(rows[0].hostel_id))) {
      const error = new Error('Forbidden: You can only transfer students out of your assigned hostel(s).');
      error.status = 403;
      throw error;
    }
  }

  const student = await getStudentById(studentId, user);
  if (student.bed_id === Number(new_bed_id)) {
    return { success: true, message: 'Student is already assigned to this bed.' };
  }

  // 3. Validate target bed structure and availability
  const [bedStructure] = await db.pool.query(
    `SELECT b.id as bed_id, r.id as room_id, r.floor_id, r.hostel_id, b.status as bed_status
     FROM beds b
     JOIN rooms r ON b.room_id = r.id
     JOIN hostels h ON r.hostel_id = h.id
     WHERE b.id = ?`,
    [new_bed_id]
  );

  if (bedStructure.length === 0) {
    const error = new Error('Selected destination bed does not exist.');
    error.status = 400;
    throw error;
  }

  const targetBed = bedStructure[0];
  if (
    targetBed.room_id !== Number(new_room_id) ||
    targetBed.hostel_id !== Number(new_hostel_id) ||
    (new_floor_id && targetBed.floor_id && targetBed.floor_id !== Number(new_floor_id))
  ) {
    const error = new Error('Invalid destination relationship: Bed does not belong to the selected room, floor, or hostel.');
    error.status = 400;
    throw error;
  }

  if (targetBed.bed_status !== 'AVAILABLE') {
    const error = new Error('Selected destination bed is not available.');
    error.status = 400;
    throw error;
  }

  // 4. Perform transaction
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // A. Free old bed if assigned
    if (student.bed_id) {
      await connection.query(
        "UPDATE beds SET status = 'AVAILABLE' WHERE id = ?",
        [student.bed_id]
      );
    }

    // B. Occupy new bed
    await connection.query(
      "UPDATE beds SET status = 'OCCUPIED' WHERE id = ?",
      [new_bed_id]
    );

    // C. Update student assignment
    await connection.query(
      "UPDATE students SET bed_id = ? WHERE id = ?",
      [new_bed_id, studentId]
    );

    await connection.commit();
    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Deactivates/archives a student user and frees their assigned bed.
 */
const deactivateStudent = async (studentId, newStatus, user) => {
  if (!['INACTIVE', 'GRADUATED'].includes(newStatus)) {
    const error = new Error('Invalid deactivation status. Supported: INACTIVE, GRADUATED.');
    error.status = 400;
    throw error;
  }

  return updateStudent(studentId, { status: newStatus }, user);
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  transferStudent,
  deactivateStudent
};
