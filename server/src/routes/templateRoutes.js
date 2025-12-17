const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authenticateToken = require('../middleware/auth');

// Public access to list standard templates
router.get('/', templateController.getTemplates);

// Protected routes for user specific data
router.get('/favorites', authenticateToken, templateController.getFavorites);
router.get('/history', authenticateToken, templateController.getHistory);

router.post('/:id/favorite', authenticateToken, templateController.toggleFavorite);
router.post('/:id/usage', authenticateToken, templateController.recordUsage);

module.exports = router;
