// src/Server/ROUTES/config.js
const express = require('express');
const router = express.Router();
const configController = require('../CONTROLLERS/configController');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== PUBLIC ROUTES =====

// GET /api/config/tafels - Haal tafel configuratie op (publiek toegankelijk)
router.get('/tafels', configController.getTafelConfig);

// GET /api/config/categorie/:categorie - Haal configuratie per categorie op
router.get('/categorie/:categorie', configController.getConfigByCategory);

// GET /api/config/:sleutel - Haal specifieke configuratie waarde op
router.get('/:sleutel', configController.getConfigValue);

// ===== ORGANISATOR ONLY ROUTES =====

// PUT /api/config/tafels - Update tafel configuratie (alleen organisatoren)
router.put('/tafels', 
    authenticateToken, 
    requireRole(['organisator']), 
    configController.updateTafelConfig
);

// PUT /api/config/:sleutel - Update specifieke configuratie waarde (alleen organisatoren)
router.put('/:sleutel', 
    authenticateToken, 
    requireRole(['organisator']), 
    configController.updateConfigValue
);

module.exports = router;