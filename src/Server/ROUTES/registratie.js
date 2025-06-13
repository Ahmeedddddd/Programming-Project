const express = require('express');
const router = express.Router();

// Let op het juiste pad!
const { validateBedrijf } = require('../MIDDLEWARE/validation');
const bedrijfController = require('../CONTROLLERS/bedrijfController');


// POST /api/auth/register/bedrijf - Registreer een nieuw bedrijf
router.post('/auth/register/bedrijf', validateBedrijf, bedrijfController.register);
