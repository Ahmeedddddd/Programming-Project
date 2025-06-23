// CREATE: /src/Server/ROUTES/bedrijf.js

const express = require('express');
const router = express.Router();
const bedrijfController = require('../CONTROLLERS/bedrijfController');
const { validateBedrijf } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== IMPORTANT: SPECIFIC ROUTES FIRST, PARAMETER ROUTES LAST =====

// PUBLIC ROUTES (no authentication required)

// SPECIFIC routes - deze moeten VOOR de parameter routes komen
router.get('/stats', bedrijfController.getBedrijfStats || ((req, res) => {
    res.json({ success: true, data: { total: 0 }, message: 'Stats endpoint not implemented yet' });
}));

// SEARCH routes
router.get('/search/:searchTerm', bedrijfController.searchBedrijven || ((req, res) => {
    res.json({ success: true, data: [], message: 'Search endpoint not implemented yet' });
}));

// FILTER routes  
router.get('/sector/:sector', bedrijfController.getBedrijvenBySector || ((req, res) => {
    res.json({ success: true, data: [], message: 'Sector filter not implemented yet' });
}));

// PROTECTED ROUTES (authentication required)
router.get('/profile',
  authenticateToken,
  requireRole(['bedrijf']),
  bedrijfController.getOwnProfile
);

router.put('/profile',
  authenticateToken,
  requireRole(['bedrijf']),
  validateBedrijf || ((req, res, next) => next()), // Fallback if validation doesn't exist
  bedrijfController.updateOwnProfile
);

// ADMIN ROUTES
router.post('/',
  authenticateToken,
  requireRole(['organisator']),
  validateBedrijf || ((req, res, next) => next()),
  bedrijfController.createBedrijf || ((req, res) => {
    res.status(501).json({ success: false, message: 'Create bedrijf not implemented yet' });
  })
);

router.put('/:bedrijfsnummer',
  authenticateToken,
  requireRole(['organisator', 'bedrijf']),
  validateBedrijf || ((req, res, next) => next()),
  bedrijfController.updateBedrijf
);

router.delete('/:bedrijfsnummer',
  authenticateToken,
  requireRole(['organisator']),
  bedrijfController.deleteBedrijf
);

// ===== PARAMETER ROUTES LAST - Deze moeten als LAATSTE komen =====

// GET /api/bedrijven - Alle bedrijven ophalen (met filtering en search)
router.get('/', bedrijfController.getAllBedrijven);

// GET /api/bedrijven/:bedrijfsnummer - Specifiek bedrijf ophalen
// DIT MOET ALS LAATSTE omdat :bedrijfsnummer alles kan matchen
router.get('/:bedrijfsnummer', bedrijfController.getBedrijf);

// GET /api/bedrijven/:bedrijfsnummer/slots - Beschikbare tijdslots voor een bedrijf
router.get('/:bedrijfsnummer/slots', authenticateToken, bedrijfController.getAvailableTimeSlots);

module.exports = router;