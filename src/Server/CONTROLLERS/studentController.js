const Student = require('../MODELS/student');
const { validationResult } = require('express-validator');

const studentController = {
  // GET /api/studenten
  async getAllStudents(req, res) {
    try {
      const students = await Student.getAll();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  },

  // GET /api/studenten/:studentnummer
  async getStudent(req, res) {
    try {
      const student = await Student.getById(req.params.studentnummer);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  },

  // POST /api/studenten
  async createStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const studentId = await Student.create(req.body);
      res.status(201).json({
        message: 'Student created successfully',
        studentnummer: req.body.studentnummer
      });
    } catch (error) {
      console.error('Error creating student:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Student number already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create student' });
      }
    }
  },

  // PUT /api/studenten/:studentnummer
  async updateStudent(req, res) {
    try {
      const affectedRows = await Student.update(req.params.studentnummer, req.body);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json({ message: 'Student updated successfully' });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ error: 'Failed to update student' });
    }
  },

  // DELETE /api/studenten/:studentnummer
  async deleteStudent(req, res) {
    try {
      const affectedRows = await Student.delete(req.params.studentnummer);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  },

  // GET /api/projecten
  async getProjects(req, res) {
    try {
      const projects = await Student.getWithProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
};

module.exports = studentController;