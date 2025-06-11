const { body } = require('express-validator');

const validateStudent = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is required'),
  body('voornaam').notEmpty().withMessage('Voornaam is required'),
  body('achternaam').notEmpty().withMessage('Achternaam is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

const validateBedrijf = [
  body('naam').notEmpty().withMessage('Bedrijfsnaam is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('sector').notEmpty().withMessage('Sector is required')
];

const validateAfspraak = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is required'),
  body('bedrijfsnummer').notEmpty().withMessage('Bedrijfsnummer is required'),
  body('startTijd').isISO8601().withMessage('Valid start time is required'),
  body('eindTijd').isISO8601().withMessage('Valid end time is required')
];

module.exports = {
  validateStudent,
  validateBedrijf,
  validateAfspraak
};