//src/Server/ROUTES/student.js
const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');
const { validateStudent } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== IMPORTANT: SPECIFIC ROUTES FIRST, PARAMETER ROUTES LAST =====

// PUBLIC ROUTES (no authentication required)

// SPECIFIC routes - deze moeten VOOR de parameter routes komen
router.get('/projecten', studentController.getProjects);
router.get('/zonder-project', studentController.getStudentsWithoutProjects);
router.get('/stats', studentController.getStudentStats);

// SEARCH routes
router.get('/search/:searchTerm', studentController.searchStudents);

// FILTER routes
router.get('/opleiding/:opleiding', studentController.getStudentsByOpleiding);
router.get('/opleidingsrichting/:richting', studentController.getStudentsByOpleidingsrichting);
router.get('/gemeente/:gemeente', studentController.getStudentsByGemeente);

// PROTECTED ROUTES (authentication required)
router.get('/profile',
  authenticateToken,
  requireRole(['student']),
  studentController.getOwnProfile
);

router.put('/profile',
  authenticateToken,
  requireRole(['student']),
  validateStudent,
  studentController.updateOwnProfile
);

// ADMIN ROUTES
router.post('/',
  authenticateToken,
  requireRole(['organisator']),
  validateStudent,
  studentController.createStudent
);

router.put('/:studentnummer',
  authenticateToken,
  requireRole(['organisator', 'student']),
  validateStudent,
  studentController.updateStudent
);

router.delete('/:studentnummer',
  authenticateToken,
  requireRole(['organisator']),
  studentController.deleteStudent
);

// ===== PARAMETER ROUTES LAST - Deze moeten als LAATSTE komen =====

// GET /api/studenten - Alle studenten ophalen (met filtering en search)
router.get('/', studentController.getAllStudents);

// GET /api/studenten/:studentnummer - Specifieke student ophalen
// DIT MOET ALS LAATSTE omdat :studentnummer alles kan matchen
router.get('/:studentnummer', studentController.getStudent);

module.exports = router;