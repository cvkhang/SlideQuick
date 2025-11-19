// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/register - Register new user
router.post('/register', authController.register);

// POST /api/login - Login user
router.post('/login', authController.login);

// POST /api/forgot-password - Request password reset
router.post('/forgot-password', authController.forgotPassword);

// POST /api/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
