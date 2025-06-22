//src/Server/MIDDLEWARE/validation.js
const { body } = require('express-validator');

const validateStudent = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is required'),
  body('voornaam').notEmpty().withMessage('Voornaam is required'),
  body('achternaam').notEmpty().withMessage('Achternaam is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

const validateStudentUpdate = [
  body('voornaam').optional({ nullable: true, checkFalsy: false }).isLength({ min: 1 }).withMessage('Voornaam cannot be empty'),
  body('achternaam').optional({ nullable: true, checkFalsy: false }).isLength({ min: 1 }).withMessage('Achternaam cannot be empty'),
  body('email').optional({ nullable: true, checkFalsy: false }).isEmail().withMessage('Valid email is required'),
  body('gsm_nummer').optional({ nullable: true, checkFalsy: false }),
  body('opleiding').optional({ nullable: true, checkFalsy: false }),
  body('opleidingsrichting').optional({ nullable: true, checkFalsy: false }),
  body('projectTitel').optional({ nullable: true, checkFalsy: false }),
  body('projectBeschrijving').optional({ nullable: true, checkFalsy: false }),
  body('overMezelf').optional({ nullable: true, checkFalsy: false }),
  body('huisnummer').optional({ nullable: true, checkFalsy: false }),
  body('straatnaam').optional({ nullable: true, checkFalsy: false }),
  body('gemeente').optional({ nullable: true, checkFalsy: false }),
  body('postcode').optional({ nullable: true, checkFalsy: false }),
  body('bus').optional({ nullable: true, checkFalsy: false }),
  body('technologieen').optional({ nullable: true, checkFalsy: false })
];

const validateBedrijf = [
  body('naam').notEmpty().withMessage('Bedrijfsnaam is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('sector').notEmpty().withMessage('Sector is required')
];

const validateOrganisator = [
  body('voornaam').notEmpty().withMessage('Voornaam is required'),
  body('achternaam').notEmpty().withMessage('Achternaam is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('gsm_nummer').optional().isMobilePhone().withMessage('Valid phone number required')
];

const validateReservatie = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is required'),
  body('bedrijfsnummer').notEmpty().withMessage('Bedrijfsnummer is required'),
  body('startTijd').isISO8601().withMessage('Valid start time is required'),
  body('eindTijd').isISO8601().withMessage('Valid end time is required')
];

const validateAfspraak = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is required'),
  body('bedrijfsnummer').notEmpty().withMessage('Bedrijfsnummer is required'),
  body('startTijd').isISO8601().withMessage('Valid start time is required'),
  body('eindTijd').isISO8601().withMessage('Valid end time is required')
];

module.exports = {
  validateStudent,
  validateStudentUpdate,
  validateBedrijf,
  validateOrganisator,
  validateReservatie,
  validateAfspraak
};