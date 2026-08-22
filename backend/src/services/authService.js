const db = require('../config/db');
const passwordUtil = require('../utils/password');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Validates login credentials.
 * @param {string} loginIdentifier - Username or Email
 * @param {string} password - Plain text password
 * @returns {Promise<object|null>} Returns user data if valid, null otherwise
 */
const validateUser = async (loginIdentifier, password) => {
  // Query user by username or email
  const [users] = await db.pool.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.status, r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE (u.username = ? OR u.email = ?)`,
    [loginIdentifier, loginIdentifier]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // If user is suspended or inactive, reject login
  if (user.status !== 'ACTIVE') {
    return { error: 'ACCOUNT_INACTIVE' };
  }

  // Compare passwords
  const isMatch = await passwordUtil.comparePassword(password, user.password_hash);
  if (!isMatch) {
    return null;
  }

  // Return user info without password hash
  const { password_hash, ...safeUser } = user;
  return safeUser;
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
  generateToken
};
