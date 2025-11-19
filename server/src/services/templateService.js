const { db } = require('../config/database');

/**
 * Get all templates with optional filtering
 * @param {Object} filters - { tags, is_standard }
 */
const mapTemplate = (tpl) => ({
  id: tpl.id,
  name: tpl.name,
  thumbnailUrl: tpl.thumbnail_url,
  colors: JSON.parse(tpl.colors),
  fontFamily: tpl.font_family,
  tags: tpl.tags || '',
  isStandard: !!tpl.is_standard,
  style: JSON.parse(tpl.style),
  createdAt: tpl.created_at
});

exports.getTemplates = (filters = {}) => {
  let query = 'SELECT * FROM templates WHERE 1=1';
  const params = [];

  if (filters.is_standard !== undefined) {
    query += ' AND is_standard = ?';
    params.push(filters.is_standard ? 1 : 0);
  }

  if (filters.search) {
    query += ' AND (name LIKE ? OR tags LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  // Tags filter (simple partial match for now)
  if (filters.tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${filters.tag}%`);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params).map(mapTemplate);
};

/**
 * Get a single template by ID
 */
exports.getTemplateById = (id) => {
  const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
  const tpl = stmt.get(id);
  if (!tpl) return null;
  return mapTemplate(tpl);
};

/**
 * Toggle favorite status for a template
 */
exports.toggleFavorite = (userId, templateId) => {
  // Check if exists
  const checkStmt = db.prepare('SELECT * FROM template_favorites WHERE user_id = ? AND template_id = ?');
  const existing = checkStmt.get(userId, templateId);

  if (existing) {
    // Remove
    const delStmt = db.prepare('DELETE FROM template_favorites WHERE user_id = ? AND template_id = ?');
    delStmt.run(userId, templateId);
    return { favorited: false };
  } else {
    // Add
    const insertStmt = db.prepare('INSERT INTO template_favorites (user_id, template_id, created_at) VALUES (?, ?, ?)');
    insertStmt.run(userId, templateId, new Date().toISOString());
    return { favorited: true };
  }
};

/**
 * Get user's favorite templates
 */
exports.getFavorites = (userId) => {
  const stmt = db.prepare(`
    SELECT t.* 
    FROM templates t
    JOIN template_favorites tf ON t.id = tf.template_id
    WHERE tf.user_id = ?
    ORDER BY tf.created_at DESC
  `);

  return stmt.all(userId).map(mapTemplate);
};

/**
 * Record template usage (history)
 */
exports.recordUsage = (userId, templateId) => {
  const now = new Date().toISOString();

  // Upsert history
  const stmt = db.prepare(`
    INSERT INTO template_history (user_id, template_id, last_used_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, template_id) 
    DO UPDATE SET last_used_at = excluded.last_used_at
  `);

  stmt.run(userId, templateId, now);
};

/**
 * Get user's template history
 */
exports.getHistory = (userId) => {
  const stmt = db.prepare(`
    SELECT t.* 
    FROM templates t
    JOIN template_history th ON t.id = th.template_id
    WHERE th.user_id = ?
    ORDER BY th.last_used_at DESC
    LIMIT 20
  `);

  return stmt.all(userId).map(mapTemplate);
};
