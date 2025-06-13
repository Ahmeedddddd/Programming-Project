// src/Server/MIDDLEWARE/validation.js
const { body } = require('express-validator');

// Student validation
const validateStudent = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is verplicht'),
  body('voornaam').notEmpty().withMessage('Voornaam is verplicht'),
  body('achternaam').notEmpty().withMessage('Achternaam is verplicht'),
  body('email').isEmail().withMessage('Geldig email adres is verplicht'),
  body('gsm_nummer').optional().isMobilePhone('any').withMessage('Geldig GSM nummer vereist'),
];

// Bedrijf validation
const validateBedrijf = [
  body('naam').notEmpty().withMessage('Bedrijfsnaam is verplicht'),
  body('email').isEmail().withMessage('Geldig email adres is verplicht'),
  body('sector').notEmpty().withMessage('Sector is verplicht'),
  body('TVA_nummer').optional().isLength({ min: 2 }).withMessage('TVA nummer moet minstens 2 karakters lang zijn'),
  body('gsm_nummer').optional().isMobilePhone('any').withMessage('Geldig GSM nummer vereist'),
];

// Reservatie validation
const validateReservatie = [
  body('studentnummer').notEmpty().withMessage('Studentnummer is verplicht'),
  body('bedrijfsnummer').notEmpty().withMessage('Bedrijfsnummer is verplicht'),
  body('startTijd').isISO8601().withMessage('Geldige start tijd is verplicht'),
  body('eindTijd').isISO8601().withMessage('Geldige eind tijd is verplicht'),
  body('opmerkingen').optional().isLength({ max: 500 }).withMessage('Opmerkingen mogen maximaal 500 karakters lang zijn'),
];

// Organisator validation
const validateOrganisator = [
  body('voornaam').notEmpty().withMessage('Voornaam is verplicht'),
  body('achternaam').notEmpty().withMessage('Achternaam is verplicht'),
  body('email').isEmail().withMessage('Geldig email adres is verplicht'),
  body('gsm_nummer').optional().isMobilePhone('any').withMessage('Geldig GSM nummer vereist'),
];

module.exports = {
  validateStudent,
  validateBedrijf,
  validateReservatie,
  validateOrganisator
};