// src/services/userService.js
const { db } = require('../config/database');
const { hashPassword, generateSalt, generateUUID, verifyPassword } = require('../utils/crypto');

/**
 * Get user by email
 * @param {string} email - Email
 * @returns {Object|null} User object or null
 */
function getUserByEmail(email) {
  const user = db
    .prepare(
      'SELECT id, username, email, password_hash, salt, created_at FROM users WHERE email = ?'
    )
    .get(email);
  return user || null;
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Object|null} User object or null
 */
function getUserByUsername(username) {
  const user = db
    .prepare(
      'SELECT id, username, email, password_hash, salt, created_at FROM users WHERE username = ?'
    )
    .get(username);
  return user || null;
}

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Object|null} User object or null
 */
function getUserById(id) {
  const user = db
    .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
    .get(id);
  return user || null;
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email (optional)
 * @param {string} userData.password - Plain text password
 * @returns {Object} Created user
 */
function createUser(userData) {
  const { username, email, password } = userData;

  // Check if user already exists
  if (getUserByUsername(username)) {
    throw new Error('USER_EXISTS');
  }

  const id = generateUUID();
  const salt = generateSalt();
  const password_hash = hashPassword(password, salt);
  const created_at = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(id, username, email || null, password_hash, salt, created_at);

  return getUserById(id);
}

/**
 * Verify user credentials
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Object|null} User object or null if invalid
 */
function verifyUser(username, password) {
  const row = db
    .prepare(
      'SELECT id, username, email, password_hash, salt, created_at FROM users WHERE username = ?'
    )
    .get(username);

  if (!row) return null;

  const valid = verifyPassword(password, row.password_hash, row.salt);
  if (!valid) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  };
}

module.exports = {
  getUserByUsername,
  getUserByEmail,
  getUserById,
  createUser,
  verifyUser,
  updatePassword,
};
/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New plain text password
 */
function updatePassword(userId, newPassword) {
  const salt = generateSalt();
  const password_hash = hashPassword(newPassword, salt);
  const stmt = db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?');
  stmt.run(password_hash, salt, userId);
  return true;
}
