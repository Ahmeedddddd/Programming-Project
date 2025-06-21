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

// POST /api/tafels/voormiddag/config - Configureer aantal tafels voor voormiddag
router.post('/voormiddag/config',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.configureVoormiddagTafels
);

// POST /api/tafels/namiddag/config - Configureer aantal tafels voor namiddag
router.post('/namiddag/config',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.configureNamiddagTafels
);

// GET /api/tafels/beschikbaar - Krijg lijst van beschikbare tafels
router.get('/beschikbaar', tafelController.getBeschikbareTafels);

// ===== STATISTICS ROUTES =====

// GET /api/tafels/statistieken - Tafel statistieken
router.get('/statistieken', tafelController.getTafelStatistieken);

// ===== BULK PROJECT ROUTES =====

// PUT /api/tafels/project/:projectTitel/tafel/:tafelNr - Bulk project toewijzing
router.put('/project/:projectTitel/tafel/:tafelNr',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.wijsProjectToeAanTafel
);

// DELETE /api/tafels/project/:projectTitel - Bulk project verwijdering
router.delete('/project/:projectTitel',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.verwijderProjectVanTafel
);

// POST /api/tafels/project/bulk-assign - Bulk toewijzing van project aan tafel
router.post('/project/bulk-assign',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.bulkAssignProjectToTafel
);

// DELETE /api/tafels/project/bulk-remove - Bulk verwijdering van project van tafel
router.delete('/project/bulk-remove',
  authenticateToken,
  requireRole(['organisator']),
  tafelController.bulkRemoveProjectFromTafel
);

module.exports = router;