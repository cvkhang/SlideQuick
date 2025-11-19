// src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const requireAuth = require('../middleware/auth');

// Public route - Get project for guest (no auth required)
router.get('/public/:id', projectController.getProjectForGuest);

// All other project routes require authentication
router.use(requireAuth);

// GET /api/projects - Get all projects
router.get('/', projectController.getAllProjects);

// GET /api/projects/:id - Get project by ID
router.get('/:id', projectController.getProjectById);

// POST /api/projects - Create new project
router.post('/', projectController.createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', projectController.updateProject);

// DELETE /api/projects/:id - Delete project (soft delete)
router.delete('/:id', projectController.deleteProject);

// POST /api/projects/:id/restore - Restore project
router.post('/:id/restore', projectController.restoreProject);

// PUT /api/projects/:id/share - Update share mode
router.put('/:id/share', projectController.updateShareMode);

module.exports = router;
