//src/Server/CONTROLLERS/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../CONFIG/database'); // ✅ FIXED: Correct import
const config = require('../CONFIG/config');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Zoek gebruiker in database (kan student, bedrijf of organisator zijn)
      const [users] = await pool.query(`
        SELECT 'student' as userType, studentnummer as id, email, NULL as password_hash
        FROM STUDENT WHERE email = ?
        UNION
        SELECT 'bedrijf' as userType, bedrijfsnummer as id, email, NULL as password_hash
        FROM BEDRIJF WHERE email = ?
        UNION
        SELECT 'organisator' as userType, organisatorId as id, email, lb.passwoord_hash
        FROM ORGANISATOR o
        LEFT JOIN LOGINBEHEER lb ON o.gebruikersId = lb.gebruikersId
        WHERE o.email = ?
      `, [email, email, email]);

      if (users.length === 0) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: 'Email of wachtwoord is incorrect'
        });
      }

      const user = users[0];

      // Voor organisatoren: check password
      if (user.userType === 'organisator' && user.password_hash) {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ 
            success: false,
            error: 'Invalid credentials',
            message: 'Email of wachtwoord is incorrect'
          });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, userType: user.userType, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          type: user.userType,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Login failed',
        message: 'Er ging iets mis bij het inloggen'
      });
    }
  },

  async register(req, res) {
    try {
      const { email, password, userType, ...userData } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user based on type
      let userId;
      if (userType === 'student') {
        const Student = require('../MODELS/student');
        userId = await Student.create({ email, ...userData });
      } else if (userType === 'bedrijf') {
        const Bedrijf = require('../MODELS/bedrijf');
        userId = await Bedrijf.create({ email, ...userData });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid user type'
        });
      }

      // Create login entry
      await pool.query(
        'INSERT INTO LOGINBEHEER (gebruikersId, passwoord_hash) VALUES (?, ?)',
        [userId, hashedPassword]
      );

      res.status(201).json({ 
        success: true,
        message: 'User registered successfully',
        userId: userId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het registreren'
      });
    }
  },

  // GET /api/auth/me - Get current user info
  async getMe(req, res) {
    try {
      const userId = req.user.userId;
      const userType = req.user.userType;

      let userData;
      
      if (userType === 'student') {
        const Student = require('../MODELS/student');
        userData = await Student.getById(userId);
      } else if (userType === 'bedrijf') {
        const Bedrijf = require('../MODELS/bedrijf');
        userData = await Bedrijf.getById(userId);
      } else if (userType === 'organisator') {
        const Organisator = require('../MODELS/organisator');
        userData = await Organisator.getById(userId);
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          ...userData,
          userType: userType
        }
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data'
      });
    }
  }
};

module.exports = authController;