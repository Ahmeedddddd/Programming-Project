//src/Server/ROUTERS/student.js
const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');


// PUBLIC ROUTES (no authentication required)
// GET /api/studenten - Alle studenten ophalen (met filtering en search)
router.get('/', studentController.getAllStudents);

// GET /api/studenten/projecten - Alle projecten ophalen
router.get('/projecten', studentController.getProjects);

// GET /api/studenten/zonder-project - Studenten zonder project
router.get('/zonder-project', studentController.getStudentsWithoutProjects);

// GET /api/studenten/stats - Student statistieken
router.get('/stats', studentController.getStudentStats);

// GET /api/studenten/opleiding/:opleiding - Studenten per opleiding
router.get('/opleiding/:opleiding', studentController.getStudentsByOpleiding);

// GET /api/studenten/opleidingsrichting/:richting - Studenten per opleidingsrichting
router.get('/opleidingsrichting/:richting', studentController.getStudentsByOpleidingsrichting);

// GET /api/studenten/gemeente/:gemeente - Studenten per gemeente
router.get('/gemeente/:gemeente', studentController.getStudentsByGemeente);

// GET /api/studenten/search/:searchTerm - Zoeken naar studenten
router.get('/search/:searchTerm', studentController.searchStudents);

// GET /api/studenten/:studentnummer - Specifieke student ophalen
router.get('/:studentnummer', studentController.getStudent);

// END PUBLIC ROUTES 

// PROTECTED ROUTES (authentication required)

// GET /api/student/profile - Eigen studentprofiel bekijken
router.get('/profile',
  authenticateToken,
  requireRole(['student']),
  studentController.getOwnProfile
);

// PUT /api/student/profile - Eigen studentprofiel bijwerken
router.put('/profile',
  authenticateToken,
  requireRole(['student']),
  studentController.updateOwnProfile
);

// END PROTECTED ROUTES 

// ADMIN ROUTES

// POST /api/studenten - Nieuwe student aanmaken (alleen organisator)
router.post('/',
  authenticateToken,
  requireRole(['organisator']),
  studentController.createStudent
);

// PUT /api/studenten/:studentnummer - Student bijwerken (organisator of student zelf)
router.put('/:studentnummer',
  authenticateToken,
  requireRole(['organisator', 'student']),
  studentController.updateStudent
);

// DELETE /api/studenten/:studentnummer - Student verwijderen (alleen organisator)
router.delete('/:studentnummer',
  authenticateToken,
  requireRole(['organisator']),
  studentController.deleteStudent
);

module.exports = router;