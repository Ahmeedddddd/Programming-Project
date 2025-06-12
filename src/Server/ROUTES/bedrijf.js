//src/Server/ROUTERS/bedrijf.js
const express = require('express');
const router = express.Router();
const bedrijfController = require('../CONTROLLERS/bedrijfController');
const { validateBedrijf } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== PUBLIC ROUTES (no authentication required) =====

// GET /api/bedrijven - Alle bedrijven ophalen
router.get('/', bedrijfController.getAllBedrijven);

// ===== PROTECTED ROUTES (authentication required) =====

// GET /api/bedrijf/profile - Eigen bedrijfsgegevens bekijken (alleen voor ingelogde bedrijven)
router.get('/profile', 
  authenticateToken, 
  requireRole(['bedrijf']), 
  bedrijfController.getOwnProfile
);

// PUT /api/bedrijf/profile - Eigen bedrijfsgegevens bijwerken (alleen voor ingelogde bedrijven)
router.put('/profile',
  authenticateToken,
  requireRole(['bedrijf']),
  validateBedrijf,
  bedrijfController.updateOwnProfile
);

// ===== END PROTECTED ROUTES (authentication required) =====

// GET /api/bedrijven/:bedrijfsnummer - Specifiek bedrijf ophalen
router.get('/:bedrijfsnummer', bedrijfController.getBedrijf);

// ===== END PUBLIC ROUTES (no authentication required) =====

// ===== ADMIN ROUTES (only organisator) =====

// POST /api/bedrijven - Nieuw bedrijf aanmaken (alleen organisator)
router.post('/',
  authenticateToken,
  requireRole(['organisator']),
  validateBedrijf,
  bedrijfController.createBedrijf
);

// PUT /api/bedrijven/:bedrijfsnummer - Bedrijf bijwerken (organisator of het bedrijf zelf)
router.put('/:bedrijfsnummer',
  authenticateToken,
  requireRole(['organisator', 'bedrijf']),
  validateBedrijf,
  bedrijfController.updateBedrijf
);

// DELETE /api/bedrijven/:bedrijfsnummer - Bedrijf verwijderen (alleen organisator)
router.delete('/:bedrijfsnummer',
  authenticateToken,
  requireRole(['organisator']),
  bedrijfController.deleteBedrijf
);

module.exports = router;