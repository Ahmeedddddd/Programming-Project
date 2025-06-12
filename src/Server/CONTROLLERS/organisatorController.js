//src/Server/CONTROLLERS/organisatorController.js
const Organisator = require('../MODELS/organisator');
const Student = require('../MODELS/student');
const Bedrijf = require('../MODELS/bedrijf');
const Reservatie = require('../MODELS/reservatie');
const { validationResult } = require('express-validator');

const organisatorController = {

  // ===== PROFILE MANAGEMENT =====

  // GET /api/organisator/profile - Eigen organisator profiel
  async getProfile(req, res) {
    try {
      const organisatorId = req.user.userId;
      
      const organisator = await Organisator.getById(organisatorId);
      
      if (!organisator) {
        return res.status(404).json({ 
          success: false,
          error: 'Organisator not found',
          message: 'Uw profiel werd niet gevonden'
        });
      }

      // Verwijder gevoelige gegevens
      const { passwoord_hash, ...safeProfile } = organisator;

      res.json({
        success: true,
        data: safeProfile
      });
    } catch (error) {
      console.error('Error fetching organisator profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch profile',
        message: 'Er ging iets mis bij het ophalen van uw profiel'
      });
    }
  },

  // PUT /api/organisator/profile - Eigen profiel bijwerken
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const organisatorId = req.user.userId;
      
      // Voorkom wijziging van kritieke velden
      const updateData = { ...req.body };
      delete updateData.organisatorId;
      delete updateData.gebruikersId;
      delete updateData.passwoord_hash;

      const affectedRows = await Organisator.update(organisatorId, updateData);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Organisator not found'
        });
      }

      res.json({ 
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating organisator profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update profile',
        message: 'Er ging iets mis bij het bijwerken van uw profiel'
      });
    }
  },

  // ===== DASHBOARD & STATISTICS =====

  // GET /api/organisator/dashboard - Dashboard gegevens
  async getDashboard(req, res) {
    try {
      // Haal alle statistieken op
      const [
        studentStats,
        bedrijfStats,
        reservatieStats,
        recentActivities
      ] = await Promise.all([
        Student.getStats(),
        Bedrijf.getStats(),
        Reservatie.getStats(),
        organisatorController.getRecentActivities()
      ]);

      const dashboard = {
        totals: {
          studenten: studentStats.total || 0,
          bedrijven: bedrijfStats.total || 0,
          reservaties: reservatieStats.total || 0,
          actieveReservaties: reservatieStats.active || 0
        },
        statistics: {
          studenten: studentStats,
          bedrijven: bedrijfStats,
          reservaties: reservatieStats
        },
        recentActivities: recentActivities,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch dashboard data',
        message: 'Er ging iets mis bij het ophalen van dashboard gegevens'
      });
    }
  },

  // Helper function voor recent activities
  async getRecentActivities() {
    try {
      // Haal recente activiteiten op (dit is een placeholder - pas aan naar je database structure)
      const activities = [];
      
      // Recent aangemaakte studenten
      const recentStudents = await Student.getRecent(5);
      recentStudents.forEach(student => {
        activities.push({
          type: 'student_created',
          message: `Nieuwe student: ${student.voornaam} ${student.achternaam}`,
          timestamp: student.created_at || new Date(),
          data: student
        });
      });

      // Recent aangemaakte bedrijven
      const recentBedrijven = await Bedrijf.getRecent(5);
      recentBedrijven.forEach(bedrijf => {
        activities.push({
          type: 'bedrijf_created',
          message: `Nieuw bedrijf: ${bedrijf.naam}`,
          timestamp: bedrijf.created_at || new Date(),
          data: bedrijf
        });
      });

      // Recent aangemaakte reservaties
      const recentReservaties = await Reservatie.getRecent(10);
      recentReservaties.forEach(reservatie => {
        activities.push({
          type: 'reservatie_created',
          message: `Nieuwe reservatie: ${reservatie.studentNaam} - ${reservatie.bedrijfNaam}`,
          timestamp: reservatie.created_at || reservatie.startTijd,
          data: reservatie
        });
      });

      // Sorteer op timestamp (nieuwste eerst)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return activities.slice(0, 20); // Laatste 20 activiteiten
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // ===== USER MANAGEMENT =====

  // GET /api/organisator/users - Alle gebruikers beheren
  async getAllUsers(req, res) {
    try {
      const { type, page = 1, limit = 20, search } = req.query;
      
      let users = [];
      
      if (!type || type === 'all') {
        // Haal alle gebruikers op
        const [studenten, bedrijven, organisatoren] = await Promise.all([
          Student.getAll(),
          Bedrijf.getAll(),
          Organisator.getAll()
        ]);
        
        users = [
          ...studenten.map(s => ({ ...s, userType: 'student' })),
          ...bedrijven.map(b => ({ ...b, userType: 'bedrijf' })),
          ...organisatoren.map(o => ({ ...o, userType: 'organisator' }))
        ];
      } else if (type === 'student') {
        const studenten = await Student.getAll();
        users = studenten.map(s => ({ ...s, userType: 'student' }));
      } else if (type === 'bedrijf') {
        const bedrijven = await Bedrijf.getAll();
        users = bedrijven.map(b => ({ ...b, userType: 'bedrijf' }));
      } else if (type === 'organisator') {
        const organisatoren = await Organisator.getAll();
        users = organisatoren.map(o => ({ ...o, userType: 'organisator' }));
      }

      // Filter op search term
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(user => 
          (user.naam && user.naam.toLowerCase().includes(searchLower)) ||
          (user.voornaam && user.voornaam.toLowerCase().includes(searchLower)) ||
          (user.achternaam && user.achternaam.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }

      // Paginatie
      const offset = (page - 1) * limit;
      const paginatedUsers = users.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch users',
        message: 'Er ging iets mis bij het ophalen van gebruikers'
      });
    }
  },

  // DELETE /api/organisator/users/:type/:id - Gebruiker verwijderen
  async deleteUser(req, res) {
    try {
      const { type, id } = req.params;
      
      if (!['student', 'bedrijf', 'organisator'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user type'
        });
      }

      // Voorkom dat organisator zichzelf verwijdert
      if (type === 'organisator' && parseInt(id) === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      let affectedRows = 0;
      
      if (type === 'student') {
        affectedRows = await Student.delete(id);
      } else if (type === 'bedrijf') {
        affectedRows = await Bedrijf.delete(id);
      } else if (type === 'organisator') {
        affectedRows = await Organisator.delete(id);
      }

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({ 
        success: true,
        message: `${type} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete user',
        message: 'Er ging iets mis bij het verwijderen van de gebruiker'
      });
    }
  },

  // ===== SYSTEM MANAGEMENT =====

  // GET /api/organisator/system-info - Systeem informatie
  async getSystemInfo(req, res) {
    try {
      const systemInfo = {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
          connected: true, // TODO: Implementeer database health check
          tables: ['STUDENT', 'BEDRIJF', 'ORGANISATOR', 'AFSPRAAK', 'FACTUUR']
        },
        features: [
          'User Management',
          'Reservation System', 
          'Authentication & Authorization',
          'Data Export',
          'Email Notifications'
        ],
        lastBackup: null, // TODO: Implementeer backup systeem
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      console.error('Error fetching system info:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch system information'
      });
    }
  },

  // ===== EXPORTS =====

  // GET /api/organisator/export/:type - Data export
  async exportData(req, res) {
    try {
      const { type } = req.params;
      const { format = 'json' } = req.query;
      
      let data = [];
      let filename = '';
      
      if (type === 'studenten') {
        data = await Student.getAll();
        filename = `studenten_export_${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'bedrijven') {
        data = await Bedrijf.getAll();
        filename = `bedrijven_export_${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'reservaties') {
        data = await Reservatie.getAll();
        filename = `reservaties_export_${new Date().toISOString().split('T')[0]}`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid export type'
        });
      }

      if (format === 'csv') {
        // TODO: Implementeer CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send('CSV export not implemented yet');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          success: true,
          exportDate: new Date().toISOString(),
          type: type,
          count: data.length,
          data: data
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to export data',
        message: 'Er ging iets mis bij het exporteren van gegevens'
      });
    }
  }
};

module.exports = organisatorController;