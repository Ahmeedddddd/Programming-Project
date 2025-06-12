//src/Server/ROUTERS/student.js
const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');
const { validateStudent } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// ===== PUBLIC ROUTES (no authentication required) =====

// GET /api/studenten - Alle studenten ophalen
router.get('/', studentController.getAllStudents);

// GET /api/studenten/projecten - Alle projecten ophalen
router.get('/projecten', studentController.getProjects);

// GET /api/studenten/:studentnummer - Specifieke student ophalen
router.get('/:studentnummer', studentController.getStudent);

// ===== PROTECTED ROUTES (authentication required) =====

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
  validateStudent,
  studentController.updateOwnProfile
);

// ===== ADMIN ROUTES (only organisator) =====

// POST /api/studenten - Nieuwe student aanmaken (alleen organisator)
router.post('/',
  authenticateToken,
  requireRole(['organisator']),
  validateStudent,
  studentController.createStudent
);

// PUT /api/studenten/:studentnummer - Student bijwerken (organisator of student zelf)
router.put('/:studentnummer',
  authenticateToken,
  requireRole(['organisator', 'student']),
  validateStudent,
  studentController.updateStudent
);

// DELETE /api/studenten/:studentnummer - Student verwijderen (alleen organisator)
router.delete('/:studentnummer',
  authenticateToken,
  requireRole(['organisator']),
  studentController.deleteStudent
);

module.exports = router;