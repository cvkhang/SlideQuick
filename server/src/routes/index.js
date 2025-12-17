// src/routes/index.js
const express = require('express');
const router = express.Router();

const projectRoutes = require('./projectRoutes');
const authRoutes = require('./authRoutes');
const uploadRoutes = require('./uploadRoutes');
const shareRoutes = require('./shareRoutes');

// Mount routes
router.use('/projects', projectRoutes);
router.use('/', authRoutes); // /register and /login
router.use('/upload', uploadRoutes);
router.use('/share', shareRoutes);
router.use('/templates', require('./templateRoutes'));

module.exports = router;
