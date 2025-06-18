// src/Server/ROUTES/tafel.js
// API routes voor tafel management en plattegrond functionaliteit

const express = require('express');
const router = express.Router();
const tafelController = require('../CONTROLLERS/tafelController');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== PUBLIC ROUTES =====

// GET /api/tafels/voormiddag - Alle tafel toewijzingen voor voormiddag (studenten aan tafels)
router.get('/voormiddag', tafelController.getVoormiddagTafels);

// GET /api/tafels/namiddag - Alle tafel toewijzingen voor namiddag (bedrijven aan tafels)
router.get('/namiddag', tafelController.getNamiddagTafels);

// GET /api/tafels/overzicht - Volledig overzicht van alle tafel toewijzingen
router.get('/overzicht', tafelController.getTafelOverzicht);

// ===== ORGANISATOR ONLY ROUTES =====

// PUT /api/tafels/student/:studentnummer/tafel/:tafelNr - Wijs student toe aan tafel
router.put('/student/:studentnummer/tafel/:tafelNr',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.wijsStudentToeAanTafel
);

// PUT /api/tafels/bedrijf/:bedrijfsnummer/tafel/:tafelNr - Wijs bedrijf toe aan tafel
router.put('/bedrijf/:bedrijfsnummer/tafel/:tafelNr',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.wijsBedrijfToeAanTafel
);

// DELETE /api/tafels/student/:studentnummer - Verwijder student van tafel
router.delete('/student/:studentnummer',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.verwijderStudentVanTafel
);

// DELETE /api/tafels/bedrijf/:bedrijfsnummer - Verwijder bedrijf van tafel
router.delete('/bedrijf/:bedrijfsnummer',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.verwijderBedrijfVanTafel
);

// POST /api/tafels/bulk-assign - Bulk toewijzing van tafels
router.post('/bulk-assign',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.bulkTafelToewijzing
);

// GET /api/tafels/beschikbaar - Krijg lijst van beschikbare tafels
router.get('/beschikbaar', tafelController.getBeschikbareTafels);

// ===== STATISTICS ROUTES =====

// GET /api/tafels/statistieken - Tafel statistieken
router.get('/statistieken', tafelController.getTafelStatistieken);

module.exports = router;