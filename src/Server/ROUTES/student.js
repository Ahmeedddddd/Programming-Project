const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');
const { validateStudent } = require('../MIDDLEWARE/validation');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// Public routes
router.get('/', studentController.getAllStudents);
router.get('/projecten', studentController.getProjects);
router.get('/:studentnummer', studentController.getStudent);

// Protected routes (require authentication)
router.post('/', 
  authenticateToken, 
  requireRole(['organisator']), 
  validateStudent, 
  studentController.createStudent
);

router.put('/:studentnummer', 
  authenticateToken, 
  requireRole(['organisator', 'student']), 
  studentController.updateStudent
);

router.delete('/:studentnummer', 
  authenticateToken, 
  requireRole(['organisator']), 
  studentController.deleteStudent
);

module.exports = router;