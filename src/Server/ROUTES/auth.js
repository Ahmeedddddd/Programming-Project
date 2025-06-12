//src/Server/ROUTES/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../CONTROLLERS/authController');
const { authenticateToken } = require('../MIDDLEWARE/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;