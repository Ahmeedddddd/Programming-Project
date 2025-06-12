//src/Server/ROUTES/reservaties.js
const express = require('express');
const router = express.Router();
const reservatieController = require('../CONTROLLERS/reservatieController');
const { validateReservatie } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== SPECIFIC ROUTES FIRST =====

// GET /api/reservaties/stats - Reservatie statistieken (alleen admin)
router.get('/stats',
  authenticateToken,
  requireRole(['organisator']),
  reservatieController.getReservatieStats
);

// GET /api/reservaties/my - Eigen reservaties ophalen
router.get('/my',
  authenticateToken,
  requireRole(['student', 'bedrijf']),
  reservatieController.getMyReservaties
);

// ===== GENERAL ROUTES =====

// GET /api/reservaties - Alle reservaties (alleen admin)
router.get('/',
  authenticateToken,
  requireRole(['organisator']),
  reservatieController.getAllReservaties
);

// POST /api/reservaties - Nieuwe reservatie aanmaken
router.post('/',
  authenticateToken,
  requireRole(['student', 'bedrijf', 'organisator']),
  validateReservatie,
  reservatieController.createReservatie
);

// ===== PARAMETERIZED ROUTES LAST =====

// GET /api/reservaties/:id - Specifieke reservatie ophalen
router.get('/:id',
  authenticateToken,
  requireRole(['student', 'bedrijf', 'organisator']),
  reservatieController.getReservatie
);

// PUT /api/reservaties/:id/status - Reservatie status bijwerken
router.put('/:id/status',
  authenticateToken,
  requireRole(['student', 'bedrijf', 'organisator']),
  reservatieController.updateReservatieStatus
);

// PUT /api/reservaties/:id - Volledige reservatie bijwerken (alleen admin)
router.put('/:id',
  authenticateToken,
  requireRole(['organisator']),
  validateReservatie,
  reservatieController.updateReservatie
);

// DELETE /api/reservaties/:id - Reservatie verwijderen (alleen admin)
router.delete('/:id',
  authenticateToken,
  requireRole(['organisator']),
  reservatieController.deleteReservatie
);

module.exports = router;