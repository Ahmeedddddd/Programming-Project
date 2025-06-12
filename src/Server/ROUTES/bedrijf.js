//src/Server/ROUTERS/bedrijf.js

const express = require('express');
const router = express.Router();
const bedrijfController = require('../CONTROLLERS/bedrijfController');
const { validateBedrijf } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

router.get('/', bedrijfController.getAllBedrijven);
router.get('/gegevensBedrijf', 
  authenticateToken, 
  requireRole(['bedrijf']), 
  bedrijfController.getGegevensBedrijf
);
router.get('/:bedrijfsnummer', bedrijfController.getBedrijf);

router.post('/', 
  authenticateToken, 
  requireRole(['organisator']), 
  validateBedrijf, 
  bedrijfController.createBedrijf
);

router.put('/:bedrijfsnummer', 
  authenticateToken, 
  requireRole(['organisator', 'bedrijf']), 
  bedrijfController.updateBedrijf
);

router.delete('/:bedrijfsnummer', 
  authenticateToken, 
  requireRole(['organisator']), 
  bedrijfController.deleteBedrijf
);

module.exports = router;