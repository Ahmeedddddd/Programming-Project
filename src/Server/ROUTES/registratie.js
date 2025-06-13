//src/Server/ROUTES/registratie.js
const express = require('express');
const router = express.Router();
const { validateBedrijf } = require('../MIDDLEWARE/validation');

// Redirect to new auth routes instead
router.post('/auth/register/bedrijf', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'Endpoint moved',
    newEndpoint: 'POST /api/auth/register/bedrijf',
    note: 'Please use the new auth routes'
  });
});

// Fallback for old route
router.post('/register/bedrijf', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'Endpoint moved',
    newEndpoint: 'POST /api/auth/register/bedrijf',
    note: 'Please use the new auth routes'
  });
});

module.exports = router;