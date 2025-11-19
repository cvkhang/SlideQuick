// src/routes/shareRoutes.js
const express = require('express');
const router = express.Router();
const { createShareSession, getShareSession } = require('../services/yjs-server');
const shareSessionService = require('../services/shareSessionService');

/**
 * POST /api/share - Create a share session
 * Body: { roomId, projectId, ownerId, role }
 */
router.post('/', (req, res) => {
  try {
    const { roomId, projectId, ownerId, role = 'edit' } = req.body;

    if (!roomId || !projectId) {
      return res.status(400).json({ error: 'roomId and projectId are required' });
    }

    const session = createShareSession(roomId, projectId, ownerId, role);

    res.status(201).json({
      success: true,
      session: {
        roomId: session.room_id,
        projectId: session.project_id,
        ownerId: session.owner_id,
        role: session.role,
        createdAt: session.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating share session:', error);
    res.status(500).json({ error: 'Failed to create share session' });
  }
});

/**
 * GET /api/share/:roomId - Get share session info
 */
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const session = getShareSession(roomId);

    if (!session) {
      return res.status(404).json({ error: 'Share session not found' });
    }

    res.json({
      roomId: session.room_id,
      projectId: session.project_id,
      ownerId: session.owner_id,
      role: session.role,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    });
  } catch (error) {
    console.error('Error getting share session:', error);
    res.status(500).json({ error: 'Failed to get share session' });
  }
});

/**
 * DELETE /api/share/:roomId - Delete a share session
 */
router.delete('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const deleted = shareSessionService.deleteSession(roomId);

    if (!deleted) {
      return res.status(404).json({ error: 'Share session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting share session:', error);
    res.status(500).json({ error: 'Failed to delete share session' });
  }
});

/**
 * GET /api/share/project/:projectId - Get all sessions for a project
 */
router.get('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const sessions = shareSessionService.getSessionsByProject(projectId);

    res.json(sessions.map(s => ({
      roomId: s.room_id,
      projectId: s.project_id,
      ownerId: s.owner_id,
      role: s.role,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })));
  } catch (error) {
    console.error('Error getting project sessions:', error);
    res.status(500).json({ error: 'Failed to get project sessions' });
  }
});

module.exports = router;
