//src/Server/ROUTES/organisator.js
const express = require('express');
const router = express.Router();
const organisatorController = require('../CONTROLLERS/organisatorController');
const { validateOrganisator } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// Alle routes vereisen organisator authenticatie
router.use(authenticateToken);
router.use(requireRole(['organisator']));

// ===== PROFILE MANAGEMENT (first, before parameterized routes) =====

// GET /api/organisator/profile - Eigen profiel ophalen
router.get('/profile', organisatorController.getProfile);

// PUT /api/organisator/profile - Eigen profiel bijwerken
router.put('/profile', 
  validateOrganisator, 
  organisatorController.updateProfile
);

// ===== DASHBOARD & STATISTICS =====

// GET /api/organisator/dashboard - Dashboard gegevens
router.get('/dashboard', organisatorController.getDashboard);

// GET /api/organisator/system-info - Systeem informatie
router.get('/system-info', organisatorController.getSystemInfo);

// ===== USER MANAGEMENT =====

// GET /api/organisator/users - Alle gebruikers ophalen
router.get('/users', organisatorController.getAllUsers);

// ===== DATA EXPORT =====

// GET /api/organisator/export/:type - Data exporteren
router.get('/export/:type', organisatorController.exportData);

// ===== PARAMETERIZED ROUTES (last, to avoid conflicts) =====

// DELETE /api/organisator/users/:type/:id - Gebruiker verwijderen
router.delete('/users/:type/:id', organisatorController.deleteUser);

module.exports = router;