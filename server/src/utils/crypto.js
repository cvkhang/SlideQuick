// src/utils/crypto.js
const crypto = require('crypto');

/**
 * Hash password using scrypt
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} Hashed password in hex format
 */
function hashPassword(password, salt) {
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.toString('hex');
}

/**
 * Generate random salt
 * @returns {string} Random salt in hex format
 */
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Verify password
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hash, salt) {
  const derived = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(derived, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

module.exports = {
  hashPassword,
  generateSalt,
  generateUUID,
  verifyPassword,
};
