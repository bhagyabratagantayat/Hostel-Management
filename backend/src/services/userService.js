const db = require('../config/db');
const passwordUtil = require('../utils/password');
const securityService = require('./securityService');

/**
 * Returns paginated user list with filters (SUPER_ADMIN only).
 */
const getUsers = async ({ page = 1, limit = 20, role, status, search }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [];
  let queryParams = [];

  if (role) {
    whereClauses.push('r.name = ?');
    queryParams.push(role);
  }

  if (status) {
    whereClauses.push('u.status = ?');
    queryParams.push(status);
  }

  if (search) {
    whereClauses.push('(u.username LIKE ? OR u.email LIKE ? OR s.full_name LIKE ? OR s.student_code LIKE ?)');
    const term = `%${search}%`;
    queryParams.push(term, term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await db.pool.query(
    `SELECT COUNT(DISTINCT u.id) as total
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN students s ON s.user_id = u.id
     ${whereSql}`,
    queryParams
  );
  const total = countRows[0]?.total || 0;

  const [users] = await db.pool.query(
    `SELECT u.id, u.username, u.email, u.status, u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
            r.name as role,
            s.id as student_id, s.full_name as student_name, s.student_code,
            (SELECT GROUP_CONCAT(h.name SEPARATOR ', ')
             FROM superintendent_hostels sh
             JOIN hostels h ON sh.hostel_id = h.id
             WHERE sh.user_id = u.id) as assigned_hostels
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN students s ON s.user_id = u.id
     ${whereSql}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, limitNum, offset]
  );

  return {
    users,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * Gets details for a single user.
 */
const getUserById = async (targetId) => {
  const [users] = await db.pool.query(
    `SELECT u.id, u.username, u.email, u.status, u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
            r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [targetId]
  );

  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const user = users[0];

  if (user.role === 'SUPERINTENDENT') {
    const [assigned] = await db.pool.query(
      `SELECT h.id, h.name, h.code
       FROM superintendent_hostels sh
       JOIN hostels h ON sh.hostel_id = h.id
       WHERE sh.user_id = ?`,
      [targetId]
    );
    user.assigned_hostels = assigned;
  } else if (user.role === 'STUDENT') {
    const [students] = await db.pool.query(
      `SELECT s.id as student_id, s.full_name, s.student_code, s.roll_number, s.branch, s.course, s.year_of_study, s.phone_number
       FROM students s WHERE s.user_id = ?`,
      [targetId]
    );
    if (students.length > 0) {
      user.student_profile = students[0];
    }
  }

  return user;
};

/**
 * Creates a new user account (SUPER_ADMIN only).
 */
const createUser = async ({ username, email, password, role, student_id, hostel_ids }, actor, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  if (!username || !email || !role || !password) {
    const err = new Error('Username, email, role, and password are required.');
    err.status = 400;
    throw err;
  }

  // Validate role
  const [roles] = await db.pool.query('SELECT id, name FROM roles WHERE name = ?', [role]);
  if (roles.length === 0) {
    const err = new Error(`Invalid role '${role}'. Must be SUPER_ADMIN, SUPERINTENDENT, or STUDENT.`);
    err.status = 400;
    throw err;
  }
  const roleId = roles[0].id;

  // Validate password strength
  const passCheck = passwordUtil.validatePasswordStrength(password);
  if (!passCheck.isValid) {
    const err = new Error(passCheck.message);
    err.status = 400;
    throw err;
  }

  // Check unique username & email
  const [existing] = await db.pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  if (existing.length > 0) {
    const err = new Error('Username or email already exists.');
    err.status = 409;
    throw err;
  }

  const hash = await passwordUtil.hashPassword(password);

  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertRes] = await conn.query(
      `INSERT INTO users (role_id, username, email, password_hash, status, must_change_password)
       VALUES (?, ?, ?, ?, 'ACTIVE', 1)`,
      [roleId, username, email, hash]
    );
    const newUserId = insertRes.insertId;

    // Link student if provided
    if (role === 'STUDENT' && student_id) {
      await conn.query('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, student_id]);
    }

    // Assign hostels if superintendent
    if (role === 'SUPERINTENDENT' && Array.isArray(hostel_ids) && hostel_ids.length > 0) {
      for (const hId of hostel_ids) {
        await conn.query(
          'INSERT INTO superintendent_hostels (user_id, hostel_id) VALUES (?, ?)',
          [newUserId, hId]
        );
      }
    }

    await conn.commit();

    await securityService.logSecurityEvent({
      action: 'USER_CREATED',
      user_id: newUserId,
      actor_id: actor.id,
      ip_address,
      user_agent,
      metadata: { username, email, role }
    });

    return { id: newUserId, username, email, role, must_change_password: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Updates a user's status (ACTIVE / INACTIVE).
 */
const updateUserStatus = async (targetId, newStatus, actor, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  if (!['ACTIVE', 'INACTIVE'].includes(newStatus)) {
    const err = new Error('Status must be ACTIVE or INACTIVE.');
    err.status = 400;
    throw err;
  }

  // Self-protection
  if (targetId === actor.id && newStatus === 'INACTIVE') {
    const err = new Error('You cannot deactivate your own account.');
    err.status = 400;
    throw err;
  }

  const [users] = await db.pool.query(
    `SELECT u.id, u.status, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [targetId]
  );
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const targetUser = users[0];

  // Last active Super Admin protection
  if (targetUser.role === 'SUPER_ADMIN' && newStatus === 'INACTIVE') {
    const [adminCount] = await db.pool.query(
      `SELECT COUNT(*) as cnt FROM users u JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'SUPER_ADMIN' AND u.status = 'ACTIVE' AND u.id != ?`,
      [targetId]
    );
    if (adminCount[0].cnt === 0) {
      const err = new Error('Cannot deactivate the last active Super Admin account.');
      err.status = 400;
      throw err;
    }
  }

  await db.pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, targetId]);

  const auditAction = newStatus === 'ACTIVE' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED';
  await securityService.logSecurityEvent({
    action: auditAction,
    user_id: targetId,
    actor_id: actor.id,
    ip_address,
    user_agent,
    metadata: { previous_status: targetUser.status, new_status: newStatus }
  });

  return { success: true, id: targetId, status: newStatus };
};

/**
 * Updates a user's role.
 */
const updateUserRole = async (targetId, newRole, actor, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  const [roles] = await db.pool.query('SELECT id, name FROM roles WHERE name = ?', [newRole]);
  if (roles.length === 0) {
    const err = new Error(`Invalid role '${newRole}'.`);
    err.status = 400;
    throw err;
  }
  const newRoleId = roles[0].id;

  const [users] = await db.pool.query(
    `SELECT u.id, u.status, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [targetId]
  );
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const targetUser = users[0];
  const oldRole = targetUser.role;

  if (oldRole === newRole) {
    return { success: true, id: targetId, role: newRole };
  }

  // Last active Super Admin protection if demoting from SUPER_ADMIN
  if (oldRole === 'SUPER_ADMIN') {
    const [adminCount] = await db.pool.query(
      `SELECT COUNT(*) as cnt FROM users u JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'SUPER_ADMIN' AND u.status = 'ACTIVE' AND u.id != ?`,
      [targetId]
    );
    if (adminCount[0].cnt === 0) {
      const err = new Error('Cannot demote the last active Super Admin account.');
      err.status = 400;
      throw err;
    }
  }

  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?', [newRoleId, targetId]);

    // If demoted from SUPERINTENDENT to another role, remove hostel assignments
    if (oldRole === 'SUPERINTENDENT' && newRole !== 'SUPERINTENDENT') {
      await conn.query('DELETE FROM superintendent_hostels WHERE user_id = ?', [targetId]);
    }

    await conn.commit();

    await securityService.logSecurityEvent({
      action: 'ROLE_CHANGED',
      user_id: targetId,
      actor_id: actor.id,
      ip_address,
      user_agent,
      metadata: { previous_role: oldRole, new_role: newRole }
    });

    return { success: true, id: targetId, role: newRole };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Resets a user's password (SUPER_ADMIN only).
 */
const adminResetPassword = async (targetId, newPassword, actor, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  const passCheck = passwordUtil.validatePasswordStrength(newPassword);
  if (!passCheck.isValid) {
    const err = new Error(passCheck.message);
    err.status = 400;
    throw err;
  }

  const [users] = await db.pool.query('SELECT id FROM users WHERE id = ?', [targetId]);
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const hash = await passwordUtil.hashPassword(newPassword);
  await db.pool.query(
    'UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = NOW() WHERE id = ?',
    [hash, targetId]
  );

  await securityService.logSecurityEvent({
    action: 'PASSWORD_RESET',
    user_id: targetId,
    actor_id: actor.id,
    ip_address,
    user_agent
  });

  return { success: true, message: 'Password reset successfully. User must change password on next login.' };
};

/**
 * Manages superintendent hostel assignments (SUPER_ADMIN only).
 */
const updateSuperintendentHostels = async (targetId, hostelIds, actor, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  const [users] = await db.pool.query(
    `SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [targetId]
  );

  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  if (users[0].role !== 'SUPERINTENDENT') {
    const err = new Error('Hostel assignments can only be set for Superintendent users.');
    err.status = 400;
    throw err;
  }

  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM superintendent_hostels WHERE user_id = ?', [targetId]);

    if (Array.isArray(hostelIds) && hostelIds.length > 0) {
      for (const hId of hostelIds) {
        await conn.query(
          'INSERT INTO superintendent_hostels (user_id, hostel_id) VALUES (?, ?)',
          [targetId, hId]
        );
      }
    }

    await conn.commit();

    await securityService.logSecurityEvent({
      action: 'HOSTEL_ASSIGNED',
      user_id: targetId,
      actor_id: actor.id,
      ip_address,
      user_agent,
      metadata: { assigned_hostel_ids: hostelIds }
    });

    return { success: true, id: targetId, assigned_hostel_ids: hostelIds };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Self-profile update with strict field whitelisting.
 */
const updateSelfProfile = async (userId, updates, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  const [users] = await db.pool.query(
    `SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [userId]
  );
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const role = users[0].role;
  let userFields = [];
  let userParams = [];

  // Whitelisted fields for user table
  if (updates.email && typeof updates.email === 'string') {
    userFields.push('email = ?');
    userParams.push(updates.email.trim());
  }

  if (userFields.length > 0) {
    userParams.push(userId);
    await db.pool.query(
      `UPDATE users SET ${userFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      userParams
    );
  }

  // If student role, check student-specific whitelisted fields
  if (role === 'STUDENT' && updates.phone_number) {
    await db.pool.query(
      'UPDATE students SET phone_number = ? WHERE user_id = ?',
      [updates.phone_number, userId]
    );
  }

  await securityService.logSecurityEvent({
    action: 'PROFILE_UPDATED',
    user_id: userId,
    actor_id: userId,
    ip_address,
    user_agent
  });

  return { success: true, message: 'Profile updated successfully.' };
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
  updateSuperintendentHostels,
  updateSelfProfile
};
