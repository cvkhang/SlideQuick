// src/services/projectService.js
const { db } = require('../config/database');

/**
 * Get all projects for a user
 * @param {string} ownerId - User ID
 * @param {boolean} [deletedOnly=false] - If true, return only deleted projects
 * @returns {Array} Array of projects
 */
function getAllProjects(ownerId, deletedOnly = false) {
  const deletedVal = deletedOnly ? 1 : 0;
  const projects = db
    .prepare(`
      SELECT p.*, u.username as owner_name 
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? AND p.is_deleted = ?
      ORDER BY p.updated_at DESC
    `)
    .all(ownerId || '', deletedVal);

  return projects.map((project) => {
    const slides = db
      .prepare('SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order')
      .all(project.id);

    return {
      id: project.id,
      name: project.name,
      ownerName: project.owner_name,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      is_deleted: project.is_deleted,
      deleted_at: project.deleted_at,
      deleted_at: project.deleted_at,
      description: project.description,
      lessonName: project.lesson_name,
      basicInfo: project.basic_info,
      slides: slides.map(mapSlideFromDb),
    };
  });
}

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @param {string} ownerId - User ID
 * @returns {Object|null} Project object or null
 */
function getProjectById(id, ownerId) {
  const project = db
    .prepare(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND p.owner_id = ? AND p.is_deleted = 0
    `)
    .get(id, ownerId);

  if (!project) return null;

  const slides = db
    .prepare('SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order')
    .all(id);

  return {
    id: project.id,
    name: project.name,
    ownerName: project.owner_name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    updatedAt: project.updated_at,
    description: project.description,
    lessonName: project.lesson_name,
    basicInfo: project.basic_info,
    slides: slides.map(mapSlideFromDb),
  };
}

/**
 * Create new project
 * @param {Object} project - Project data
 * @param {string} ownerId - User ID
 * @returns {Object} Created project
 */
function createProject(project, ownerId) {
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, created_at, updated_at, owner_id, description, lesson_name, basic_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order, image_url, elements, saved_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertProject.run(
      project.id,
      project.name,
      project.createdAt,
      project.updatedAt,
      ownerId,
      project.description || '',
      project.lessonName || '',
      project.basicInfo || ''
    );

    project.slides.forEach((slide, index) => {
      insertSlide.run(
        slide.id,
        project.id,
        slide.title,
        slide.content || '',
        slide.template,
        slide.backgroundColor,
        slide.textColor,
        index,
        slide.imageUrl || null,
        JSON.stringify(slide.elements || []),
        JSON.stringify(slide.savedContent || {})
      );
    });
  });

  transaction();
  return getProjectById(project.id, ownerId);
}

/**
 * Update existing project
 * @param {Object} project - Project data
 * @param {string} ownerId - User ID
 * @returns {Object|null} Updated project or null
 */
function updateProject(project, ownerId) {
  const updateProjectStmt = db.prepare(`
    UPDATE projects 
    SET name = ?, updated_at = ?, description = ?, lesson_name = ?, basic_info = ?
    WHERE id = ? AND owner_id = ?
  `);

  const deleteSlides = db.prepare('DELETE FROM slides WHERE project_id = ?');

  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order, image_url, elements, saved_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const info = updateProjectStmt.run(
      project.name,
      project.updatedAt,
      project.description || '',
      project.lessonName || '',
      project.basicInfo || '',
      project.id,
      ownerId
    );

    if (info.changes === 0) {
      throw new Error('not_found_or_not_owner');
    }

    deleteSlides.run(project.id);

    project.slides.forEach((slide, index) => {
      insertSlide.run(
        slide.id,
        project.id,
        slide.title,
        slide.content || '',
        slide.template,
        slide.backgroundColor,
        slide.textColor,
        index,
        slide.imageUrl || null,
        JSON.stringify(slide.elements || []),
        JSON.stringify(slide.savedContent || {})
      );
    });
  });

  try {
    transaction();
  } catch (err) {
    if (err.message === 'not_found_or_not_owner') return null;
    throw err;
  }

  return getProjectById(project.id, ownerId);
}

// ... (Existing delete/restore functions remain unchanged if they don't touch slides structure directly, 
//      but if they are not in this block, they are safe. I will assume they are safe as I am replacing create/update/map) ...

/**
 * Delete project
 * @param {string} id - Project ID
 * @param {string} ownerId - User ID
 * @returns {boolean} True if deleted
 */

/**
 * Delete project (Soft delete)
 * @param {string} id - Project ID
 * @param {string} ownerId - User ID
 * @returns {boolean} True if deleted
 */
function deleteProject(id, ownerId) {
  const stmt = db.prepare(`
    UPDATE projects 
    SET is_deleted = 1, deleted_at = ? 
    WHERE id = ? AND owner_id = ?
  `);

  const info = stmt.run(new Date().toISOString(), id, ownerId);
  return info.changes > 0;
}

/**
 * Restore project (Undo soft delete)
 * @param {string} id - Project ID
 * @param {string} ownerId - User ID
 * @returns {boolean} True if restored
 */
function restoreProject(id, ownerId) {
  const stmt = db.prepare(`
    UPDATE projects 
    SET is_deleted = 0, deleted_at = NULL 
    WHERE id = ? AND owner_id = ?
  `);

  const info = stmt.run(id, ownerId);
  return info.changes > 0;
}

/**
 * Map slide from database format to API format
 * @param {Object} slide - Database slide object
 * @returns {Object} API slide object
 */
const mapSlideFromDb = (slide) => ({
  id: slide.id,
  title: slide.title,
  content: slide.content,
  template: slide.template,
  backgroundColor: slide.background_color,
  textColor: slide.text_color,
  imageUrl: slide.image_url,
  elements: slide.elements ? JSON.parse(slide.elements) : [],
  savedContent: slide.saved_content ? JSON.parse(slide.saved_content) : {},
});

const updateProjectFromCollab = (project) => {
  if (!project || !project.id || !project.slides) {
    return false;
  }

  const now = new Date().toISOString();

  const updateProjectStmt = db.prepare(`
    UPDATE projects 
    SET name = ?, updated_at = ?
    WHERE id = ?
  `);

  const deleteSlides = db.prepare('DELETE FROM slides WHERE project_id = ?');

  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order, image_url, elements, saved_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const transaction = db.transaction(() => {
      updateProjectStmt.run(
        project.name,
        now,
        project.id
      );

      deleteSlides.run(project.id);

      project.slides.forEach((slide, index) => {
        insertSlide.run(
          slide.id,
          project.id,
          slide.title || '',
          slide.content || '',
          slide.template || 'blank',
          slide.backgroundColor || '#ffffff',
          slide.textColor || '#000000',
          index,
          slide.imageUrl || null,
          JSON.stringify(slide.elements || []),
          JSON.stringify(slide.savedContent || {})
        );
      });
    });

    transaction();
    console.log(`💾 Synced project to database: ${project.id}`);
    return true;
  } catch (err) {
    console.error('Error updating project from collab:', err);
    return false;
  }
}

/**
 * Get project for guest access (checks share_mode)
 * @param {string} projectId - Project ID
 * @returns {Object|null} Project with shareMode, or null if not found/private
 */
function getProjectForGuest(projectId) {
  const project = db
    .prepare(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND p.is_deleted = 0
    `)
    .get(projectId);

  if (!project) return null;

  const shareMode = project.share_mode || 'private';

  // If private, return info but no slides (frontend will handle access denied)
  if (shareMode === 'private') {
    return {
      id: project.id,
      name: project.name,
      ownerName: project.owner_name,
      ownerId: project.owner_id,
      shareMode: 'private',
      slides: [],
    };
  }

  // For view/edit, return full project
  const slides = db
    .prepare('SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order')
    .all(projectId);

  return {
    id: project.id,
    name: project.name,
    ownerName: project.owner_name,
    ownerId: project.owner_id,
    shareMode,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    slides: slides.map(mapSlideFromDb),
  };
}

/**
 * Update share mode for a project
 * @param {string} projectId - Project ID
 * @param {string} ownerId - Owner ID (for authorization)
 * @param {string} shareMode - 'private' | 'view' | 'edit'
 * @returns {boolean} True if updated
 */
function updateShareMode(projectId, ownerId, shareMode) {
  const validModes = ['private', 'view', 'edit'];
  if (!validModes.includes(shareMode)) return false;

  const stmt = db.prepare(`
    UPDATE projects 
    SET share_mode = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?
  `);

  const result = stmt.run(shareMode, new Date().toISOString(), projectId, ownerId);
  return result.changes > 0;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  updateProjectFromCollab,
  getProjectForGuest,
  updateShareMode,
};
