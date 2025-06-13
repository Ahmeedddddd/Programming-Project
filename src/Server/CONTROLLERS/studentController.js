//src/Server/CONTROLLERS/studentController.js
const Student = require('../MODELS/student');
const { validationResult } = require('express-validator');

const studentController = {
  
  // ===== PUBLIC ENDPOINTS =====
  
  // GET /api/studenten - Alle studenten ophalen
  async getAllStudents(req, res) {
    try {
      const students = await Student.getAll();
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students',
        message: 'Er ging iets mis bij het ophalen van de studenten'
      });
    }
  },

  // GET /api/studenten/:studentnummer - Specifieke student ophalen
  async getStudent(req, res) {
    try {
      const { studentnummer } = req.params;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid studentnummer provided' 
        });
      }

      const student = await Student.getById(studentnummer);
      
      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Student met dit nummer bestaat niet'
        });
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch student',
        message: 'Er ging iets mis bij het ophalen van de student'
      });
    }
  },

  // GET /api/studenten/projecten - Alle projecten ophalen
  async getProjects(req, res) {
    try {
      const projects = await Student.getWithProjects();
      res.json({
        success: true,
        data: projects,
        count: projects.length
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch projects',
        message: 'Er ging iets mis bij het ophalen van de projecten'
      });
    }
  },

  // ===== AUTHENTICATED ENDPOINTS =====

  // GET /api/student/profile - Eigen studentprofiel bekijken
  async getOwnProfile(req, res) {
    try {
      const studentnummer = req.user.userId;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Studentnummer not found in token',
          message: 'Uw sessie is ongeldig, log opnieuw in'
        });
      }

      const student = await Student.getById(studentnummer);
      
      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Uw studentprofiel werd niet gevonden'
        });
      }

      res.json({
        success: true,
        data: student,
        message: 'Studentprofiel succesvol opgehaald'
      });
    } catch (error) {
      console.error('Error fetching own profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch student profile',
        message: 'Er ging iets mis bij het ophalen van uw profiel'
      });
    }
  },

  // PUT /api/student/profile - Eigen studentprofiel bijwerken
  async updateOwnProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const studentnummer = req.user.userId;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Studentnummer not found in token'
        });
      }

      // Voorkom dat ze hun eigen studentnummer kunnen wijzigen
      const updateData = { ...req.body };
      delete updateData.studentnummer;
      delete updateData.id;

      const affectedRows = await Student.update(studentnummer, updateData);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Uw studentprofiel werd niet gevonden'
        });
      }

      // Haal updated data op
      const updatedStudent = await Student.getById(studentnummer);

      res.json({ 
        success: true,
        message: 'Studentprofiel succesvol bijgewerkt',
        data: updatedStudent
      });
    } catch (error) {
      console.error('Error updating own profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update student profile',
        message: 'Er ging iets mis bij het bijwerken van uw profiel'
      });
    }
  },

  // ===== ADMIN ENDPOINTS =====

  // POST /api/studenten - Nieuwe student aanmaken (alleen organisator)
  async createStudent(req, res) {
    try {
      // Basic validation - check if required fields exist
      const { studentnummer, voornaam, achternaam, email } = req.body;
      
      if (!studentnummer || !voornaam || !achternaam || !email) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields',
          message: 'Studentnummer, voornaam, achternaam en email zijn verplicht',
          required: ['studentnummer', 'voornaam', 'achternaam', 'email']
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format',
          message: 'Ongeldig email adres'
        });
      }

      const studentId = await Student.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
          studentnummer: req.body.studentnummer,
          id: studentId,
          ...req.body
        }
      });
    } catch (error) {
      console.error('Error creating student:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false,
          error: 'Student number already exists',
          message: 'Er bestaat al een student met dit studentnummer'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to create student',
          message: 'Er ging iets mis bij het aanmaken van de student'
        });
      }
    }
  },

  // PUT /api/studenten/:studentnummer - Student bijwerken (organisator of student zelf)
  async updateStudent(req, res) {
    try {
      const { studentnummer } = req.params;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid studentnummer provided'
        });
      }

      // Check of student zichzelf wil updaten of organisator is
      if (req.user.userType === 'student' && req.user.userId !== studentnummer) {
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden',
          message: 'U kunt alleen uw eigen studentprofiel bijwerken'
        });
      }

      // Don't allow changing studentnummer
      const updateData = { ...req.body };
      delete updateData.studentnummer;
      delete updateData.id;

      const affectedRows = await Student.update(studentnummer, updateData);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      res.json({ 
        success: true,
        message: 'Student updated successfully',
        studentnummer: studentnummer
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update student',
        message: 'Er ging iets mis bij het bijwerken van de student'
      });
    }
  },

  // DELETE /api/studenten/:studentnummer - Student verwijderen (alleen organisator)
  async deleteStudent(req, res) {
    try {
      const { studentnummer } = req.params;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid studentnummer provided'
        });
      }

      const affectedRows = await Student.delete(studentnummer);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      res.json({ 
        success: true,
        message: 'Student deleted successfully',
        studentnummer: studentnummer
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete student',
        message: 'Er ging iets mis bij het verwijderen van de student'
      });
    }
  }
};

module.exports = studentController;