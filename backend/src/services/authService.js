const db = require('../config/db');
const passwordUtil = require('../utils/password');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const securityService = require('./securityService');

/**
 * Validates login credentials.
 * @param {string} loginIdentifier - Username or Email
 * @param {string} password - Plain text password
 * @param {object} [reqContext] - Request context for audit logging { ip_address, user_agent }
 * @returns {Promise<object|null>} Returns user data if valid, null otherwise
 */
const validateUser = async (loginIdentifier, password, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  // Query user by username or email
  const [users] = await db.pool.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.status, u.must_change_password, r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE (u.username = ? OR u.email = ?)`,
    [loginIdentifier, loginIdentifier]
  );

  if (users.length === 0) {
    await securityService.logSecurityEvent({
      action: 'LOGIN_FAILED',
      ip_address,
      user_agent,
      metadata: { identifier: loginIdentifier, reason: 'USER_NOT_FOUND' }
    });
    return null;
  }

  const user = users[0];

  // Compare passwords first
  const isMatch = await passwordUtil.comparePassword(password, user.password_hash);
  if (!isMatch) {
    await securityService.logSecurityEvent({
      action: 'LOGIN_FAILED',
      user_id: user.id,
      ip_address,
      user_agent,
      metadata: { identifier: loginIdentifier, reason: 'INVALID_PASSWORD' }
    });
    return null;
  }

  // If user is suspended or inactive, reject login
  if (user.status !== 'ACTIVE') {
    await securityService.logSecurityEvent({
      action: 'LOGIN_FAILED',
      user_id: user.id,
      ip_address,
      user_agent,
      metadata: { identifier: loginIdentifier, reason: 'ACCOUNT_INACTIVE', status: user.status }
    });
    return { error: 'ACCOUNT_INACTIVE' };
  }

  // Update last_login_at
  await db.pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

  // Log successful login
  await securityService.logSecurityEvent({
    action: 'LOGIN_SUCCESS',
    user_id: user.id,
    ip_address,
    user_agent
  });

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

/**
 * Changes a user's password.
 * @param {number} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {object} [reqContext]
 */
const changePassword = async (userId, currentPassword, newPassword, reqContext = {}) => {
  const { ip_address = null, user_agent = null } = reqContext;

  // Validate strength
  const strengthCheck = passwordUtil.validatePasswordStrength(newPassword);
  if (!strengthCheck.isValid) {
    const err = new Error(strengthCheck.message);
    err.status = 400;
    throw err;
  }

  const [users] = await db.pool.query('SELECT id, password_hash FROM users WHERE id = ?', [userId]);
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const user = users[0];

  // Verify current password
  const isMatch = await passwordUtil.comparePassword(currentPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.status = 400;
    throw err;
  }

  // Hash new password and update
  const newHash = await passwordUtil.hashPassword(newPassword);
  await db.pool.query(
    'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ?',
    [newHash, userId]
  );

  // Log event
  await securityService.logSecurityEvent({
    action: 'PASSWORD_CHANGED',
    user_id: userId,
    actor_id: userId,
    ip_address,
    user_agent
  });

  return { success: true, message: 'Password updated successfully.' };
};

/**
 * Gets detailed user profile.
 */
const getUserProfile = async (userId) => {
  const [users] = await db.pool.query(
    `SELECT u.id, u.username, u.email, u.status, u.must_change_password, u.last_login_at, u.created_at, r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [userId]
  );

  if (users.length === 0) {
    const err = new Error('User profile not found.');
    err.status = 404;
    throw err;
  }

  const user = users[0];

  if (user.role === 'STUDENT') {
    const [students] = await db.pool.query(
      `SELECT s.id as student_id, s.full_name, s.student_code, s.roll_number, s.branch, s.course, s.year_of_study, s.phone_number, s.photo_url,
              h.name as hostel_name, r.room_number, b.bed_number
       FROM students s
       LEFT JOIN beds b ON s.bed_id = b.id
       LEFT JOIN rooms r ON b.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       WHERE s.user_id = ?`,
      [userId]
    );

    if (students.length > 0) {
      user.student_profile = students[0];
    }
  }

  return user;
};

/**
 * Generates a signed JWT for the authenticated user.
 * @param {object} user - Safe user object
 * @returns {string} Signed JWT token string
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    env.JWT.secret,
    { expiresIn: env.JWT.expiresIn }
  );
};

module.exports = {
  validateUser,
  changePassword,
  getUserProfile,
  generateToken
};
