// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload } = require('../middleware/upload');

// POST /api/upload - Upload image
router.post('/', upload.single('image'), uploadController.uploadImage);

module.exports = router;
