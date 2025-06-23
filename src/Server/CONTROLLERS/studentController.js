//src/Server/CONTROLLERS/studentController.js
const Student = require('../MODELS/student');
const Reservatie = require('../MODELS/reservatie');
const { validationResult } = require('express-validator');

const studentController = {
  
  // ===== PUBLIC ENDPOINTS =====
  
  // GET /api/studenten - Alle studenten ophalen
  async getAllStudents(req, res) {
    try {
      const { search, opleiding, opleidingsrichting, gemeente, hasProject, page = 1, limit = 20 } = req.query;
      
      let students;
      
      // Gebruik advanced search als er filters zijn
      if (search || opleiding || opleidingsrichting || gemeente || hasProject !== undefined) {
        const filters = {
          searchTerm: search,
          opleiding,
          opleidingsrichting,
          gemeente,
          hasProject: hasProject ? hasProject === 'true' : undefined
        };
        students = await Student.advancedSearch(filters);
      } else {
        students = await Student.getAll();
      }

      // Paginatie toepassen
      const offset = (page - 1) * limit;
      const paginatedStudents = students.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: paginatedStudents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: students.length,
          pages: Math.ceil(students.length / limit)
        },
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
          message: 'Student niet gevonden'
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

  // GET /api/studenten/zonder-project - Studenten zonder project
  async getStudentsWithoutProjects(req, res) {
    try {
      const students = await Student.getWithoutProjects();
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching students without projects:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students without projects',
        message: 'Er ging iets mis bij het ophalen van studenten zonder project'
      });
    }
  },

  // GET /api/studenten/opleiding/:opleiding - Studenten per opleiding
  async getStudentsByOpleiding(req, res) {
    try {
      const { opleiding } = req.params;
      const students = await Student.getByOpleiding(opleiding);
      
      res.json({
        success: true,
        data: students,
        count: students.length,
        opleiding: opleiding
      });
    } catch (error) {
      console.error('Error fetching students by opleiding:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students by opleiding',
        message: 'Er ging iets mis bij het ophalen van studenten per opleiding'
      });
    }
  },

  // GET /api/studenten/opleidingsrichting/:richting - Studenten per opleidingsrichting
  async getStudentsByOpleidingsrichting(req, res) {
    try {
      const { richting } = req.params;
      const students = await Student.getByOpleidingsrichting(richting);
      
      res.json({
        success: true,
        data: students,
        count: students.length,
        opleidingsrichting: richting
      });
    } catch (error) {
      console.error('Error fetching students by opleidingsrichting:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students by opleidingsrichting',
        message: 'Er ging iets mis bij het ophalen van studenten per opleidingsrichting'
      });
    }
  },

  // GET /api/studenten/gemeente/:gemeente - Studenten per gemeente
  async getStudentsByGemeente(req, res) {
    try {
      const { gemeente } = req.params;
      const students = await Student.getByGemeente(gemeente);
      
      res.json({
        success: true,
        data: students,
        count: students.length,
        gemeente: gemeente
      });
    } catch (error) {
      console.error('Error fetching students by gemeente:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students by gemeente',
        message: 'Er ging iets mis bij het ophalen van studenten per gemeente'
      });
    }
  },

  // GET /api/studenten/search/:searchTerm - Zoeken naar studenten
  async searchStudents(req, res) {
    try {
      const { searchTerm } = req.params;
      const students = await Student.searchByName(searchTerm);
      
      res.json({
        success: true,
        data: students,
        count: students.length,
        searchTerm: searchTerm
      });
    } catch (error) {
      console.error('Error searching students:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search students',
        message: 'Er ging iets mis bij het zoeken naar studenten'
      });
    }
  },

  // GET /api/studenten/stats - Student statistieken
  async getStudentStats(req, res) {
    try {
      const stats = await Student.getStats();
      
      res.json({
        success: true,
        data: stats,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch student statistics',
        message: 'Er ging iets mis bij het ophalen van student statistieken'
      });
    }
  },

  // ===== AUTHENTICATED ENDPOINTS =====

  // GET /api/studenten/profile - Eigen studentprofiel bekijken
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

      // Verwijder gevoelige gegevens indien nodig
      const { ...safeProfile } = student;

      res.json({
        success: true,
        data: safeProfile,
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

  // PUT /api/studenten/profile - Eigen studentprofiel bijwerken
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

  // ===== SLOTS ENDPOINT =====

  // GET /api/studenten/:studentnummer/slots - Beschikbare tijdslots voor een student
  async getAvailableTimeSlots(req, res) {
    try {
      const { studentnummer } = req.params;
      
      if (!studentnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Studentnummer is required',
          message: 'Studentnummer is verplicht'
        });
      }

      // Check if student exists
      const student = await Student.getById(studentnummer);
      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      // Get default time slots for students
      const timeSlots = Reservatie.getDefaultSlots();

      // Mark slots that are already taken
      const reservations = await Reservatie.getByStudent(studentnummer);
      const occupiedSlots = reservations
        .filter(r => r.status === 'bevestigd')
        .map(r => r.startTijd.slice(0, 5)); // Format 'HH:MM:SS' to 'HH:MM'

      const enrichedSlots = timeSlots.map(slot => ({
          ...slot,
          available: !occupiedSlots.includes(slot.start)
      }));

      res.status(200).json({
        success: true,
        message: 'Beschikbare tijdslots opgehaald',
        data: enrichedSlots
      });

    } catch (error) {
      console.error('Error getting available time slots for student:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Er is een fout opgetreden bij het ophalen van de tijdslots'
      });
    }
  },

  // ===== ADMIN ENDPOINTS =====

  // POST /api/studenten - Nieuwe student aanmaken (alleen organisator)
  async createStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const studentId = await Student.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
          studentnummer: req.body.studentnummer,
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
  },  // PUT /api/studenten/:studentnummer - Student bijwerken (organisator of student zelf)
  async updateStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { studentnummer } = req.params;
      
      // Check of student zichzelf wil updaten of organisator is
      if (req.user.userType === 'student' && req.user.userId !== studentnummer) {
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden',
          message: 'U kunt alleen uw eigen studentprofiel bijwerken'
        });
      }      // Voorkom wijziging van kritieke velden en filter lege/ongewenste waarden
      const updateData = { ...req.body };
      delete updateData.studentnummer;
      delete updateData.id;
      
      // Filter lege strings weg - als iets leeg is, updaten we het niet
      // Dit voorkomt database constraint problemen met unique fields en NOT NULL constraints
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Als er niets te updaten valt, return vroeg
      if (Object.keys(updateData).length === 0) {
        return res.json({ 
          success: true,
          message: 'No changes to update',
          studentnummer: studentnummer
        });
      }

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
      });    } catch (error) {
      console.error('Error updating student:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          return res.status(400).json({
            success: false,
            error: 'Duplicate email',
            message: 'Dit email adres is al in gebruik door een andere student'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Duplicate entry',
          message: 'Een van de waarden is al in gebruik'
        });
      }
      
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