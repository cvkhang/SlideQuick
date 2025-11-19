// src/services/shareSessionService.js
// Service for managing persistent share sessions

const { db } = require('../config/database');

/**
 * Create a new share session
 */
function createSession({ roomId, projectId, ownerId, role = 'edit', yjsState = null }) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO share_sessions (room_id, project_id, owner_id, role, yjs_state, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(roomId, projectId, ownerId || null, role, yjsState, now, now);

  return getSession(roomId);
}

/**
 * Get a share session by room ID
 */
function getSession(roomId) {
  const stmt = db.prepare(`
    SELECT room_id, project_id, owner_id, role, yjs_state, created_at, updated_at, expires_at
    FROM share_sessions
    WHERE room_id = ?
  `);

  return stmt.get(roomId) || null;
}

/**
 * Get all sessions for a project
 */
function getSessionsByProject(projectId) {
  const stmt = db.prepare(`
    SELECT room_id, project_id, owner_id, role, created_at, updated_at, expires_at
    FROM share_sessions
    WHERE project_id = ?
    ORDER BY created_at DESC
  `);

  return stmt.all(projectId);
}

/**
 * Update Y.js state for a session
 */
function updateYjsState(roomId, yjsState) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE share_sessions
    SET yjs_state = ?, updated_at = ?
    WHERE room_id = ?
  `);

  const result = stmt.run(yjsState, now, roomId);
  return result.changes > 0;
}

/**
 * Update session metadata
 */
function updateSession(roomId, updates) {
  const now = new Date().toISOString();
  const allowedFields = ['role', 'expires_at'];

  const setClause = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .map(key => `${key} = ?`)
    .join(', ');

  if (!setClause) return false;

  const values = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .map(key => updates[key]);

  const stmt = db.prepare(`
    UPDATE share_sessions
    SET ${setClause}, updated_at = ?
    WHERE room_id = ?
  `);

  const result = stmt.run(...values, now, roomId);
  return result.changes > 0;
}

/**
 * Delete a session
 */
function deleteSession(roomId) {
  const stmt = db.prepare('DELETE FROM share_sessions WHERE room_id = ?');
  const result = stmt.run(roomId);
  return result.changes > 0;
}

/**
 * Delete expired sessions
 */
function cleanupExpiredSessions() {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    DELETE FROM share_sessions
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `);

  const result = stmt.run(now);
  return result.changes;
}

/**
 * Check if session exists
 */
function sessionExists(roomId) {
  const stmt = db.prepare('SELECT 1 FROM share_sessions WHERE room_id = ?');
  return !!stmt.get(roomId);
}

module.exports = {
  createSession,
  getSession,
  getSessionsByProject,
  updateYjsState,
  updateSession,
  deleteSession,
  cleanupExpiredSessions,
  sessionExists,
};
