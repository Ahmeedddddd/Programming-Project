//src/Server/CONTROLLERS/authController.js
const Auth = require('../MODELS/auth'); // ✅ NIEUW: Gebruik nieuwe Auth model
const { authenticateUser } = require('../CONFIG/passwordhasher'); // ✅ Direct gebruik van jullie functie
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../CONFIG/database');
const config = require('../CONFIG/config');

const authController = {

  // 🔐 LOGIN - VERBETERDE VERSIE van jouw bestaande code
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // ✅ Eerst bepalen welk type user dit is
      const user = await Auth.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: 'Email of wachtwoord is onjuist'
        });
      }

      // ✅ GEBRUIK JULLIE AUTHENTICATEUSER FUNCTIE
      let identifier = user.userType === 'organisator' ? email : user.id;
      const authResult = await authenticateUser(user.userType, identifier, password);
      
      if (!authResult.success) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: authResult.message
        });
      }

      // ✅ Generate JWT token - blijft hetzelfde als jouw code
      const tokenPayload = {
        gebruikersId: authResult.user.gebruikersId,
        userId: user.id,
        userType: user.userType,
        email: email
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
      });

      res.json({
        success: true,
        message: 'Login succesvol',
        token: token,
        user: {
          userId: user.id,
          userType: user.userType,
          email: email
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

  // 📝 REGISTER STUDENT - NIEUWE FUNCTIONALITEIT
  async registerStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { password, ...studentData } = req.body;

      // Check if email already exists
      const existingUser = await Auth.findUserByEmail(studentData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Check if studentnummer already exists
      const [existingStudent] = await pool.query(
        'SELECT studentnummer FROM STUDENT WHERE studentnummer = ?',
        [studentData.studentnummer]
      );

      if (existingStudent.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Student number already exists',
          message: 'Er bestaat al een student met dit studentnummer'
        });
      }

      // Register student
      const userResult = await Auth.registerStudent(studentData, password);

      // Generate token for immediate login
      const tokenPayload = {
        gebruikersId: userResult.gebruikersId,
        userId: userResult.userId,
        userType: userResult.userType,
        email: userResult.email
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
      });

      res.status(201).json({
        success: true,
        message: 'Student account succesvol aangemaakt',
        token: token,
        user: {
          userId: userResult.userId,
          userType: userResult.userType,
          email: userResult.email
        }
      });

    } catch (error) {
      console.error('Student registration error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met deze gegevens'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Registration failed',
          message: 'Er ging iets mis bij het aanmaken van je account'
        });
      }
    }
  },

  // 🏢 REGISTER BEDRIJF - NIEUWE FUNCTIONALITEIT
  async registerBedrijf(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { password, ...bedrijfData } = req.body;

      // Check if email already exists
      const existingUser = await Auth.findUserByEmail(bedrijfData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Check if TVA number already exists
      if (bedrijfData.TVA_nummer) {
        const [existingTVA] = await pool.query(
          'SELECT bedrijfsnummer FROM BEDRIJF WHERE TVA_nummer = ?',
          [bedrijfData.TVA_nummer]
        );

        if (existingTVA.length > 0) {
          return res.status(409).json({ 
            success: false,
            error: 'TVA number already exists',
            message: 'Er bestaat al een bedrijf met dit TVA nummer'
          });
        }
      }

      // Register bedrijf
      const userResult = await Auth.registerBedrijf(bedrijfData, password);

      // Generate token for immediate login
      const tokenPayload = {
        gebruikersId: userResult.gebruikersId,
        userId: userResult.userId,
        userType: userResult.userType,
        email: userResult.email
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
      });

      res.status(201).json({
        success: true,
        message: 'Bedrijf account succesvol aangemaakt',
        token: token,
        user: {
          userId: userResult.userId,
          userType: userResult.userType,
          email: userResult.email
        }
      });

    } catch (error) {
      console.error('Bedrijf registration error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met deze gegevens'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Registration failed',
          message: 'Er ging iets mis bij het aanmaken van je account'
        });
      }
    }
  },

  // 👔 REGISTER ORGANISATOR - NIEUWE FUNCTIONALITEIT (Admin only)
  async registerOrganisator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { password, ...organisatorData } = req.body;

      // Check if email already exists
      const existingUser = await Auth.findUserByEmail(organisatorData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Register organisator
      const userResult = await Auth.registerOrganisator(organisatorData, password);

      // Generate token for immediate login
      const tokenPayload = {
        gebruikersId: userResult.gebruikersId,
        userId: userResult.userId,
        userType: userResult.userType,
        email: userResult.email
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
      });

      res.status(201).json({
        success: true,
        message: 'Organisator account succesvol aangemaakt',
        token: token,
        user: {
          userId: userResult.userId,
          userType: userResult.userType,
          email: userResult.email
        }
      });

    } catch (error) {
      console.error('Organisator registration error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met deze gegevens'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Registration failed',
          message: 'Er ging iets mis bij het aanmaken van je account'
        });
      }
    }
  },

  // ✅ BESTAANDE REGISTER FUNCTIE - behouden voor backward compatibility
  async register(req, res) {
    try {
      const { email, password, userType, ...userData } = req.body;

      // Redirect to specific registration based on userType
      if (userType === 'student') {
        req.body = { password, ...userData };
        return await authController.registerStudent(req, res);
      } else if (userType === 'bedrijf') {
        req.body = { password, ...userData };
        return await authController.registerBedrijf(req, res);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid user type',
          message: 'Gebruik /register/student of /register/bedrijf'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het registreren'
      });
    }
  },

  // ✅ BESTAANDE GET ME FUNCTIE - onveranderd
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
  },

  // 🔐 CHANGE PASSWORD - NIEUWE FUNCTIONALITEIT
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const { gebruikersId, email } = req.user;

      // Get current credentials
      const userCredentials = await Auth.getLoginCredentials(email);
      
      if (!userCredentials) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const passwordValid = await Auth.verifyPassword(currentPassword, userCredentials.passwoord_hash);
      
      if (!passwordValid) {
        return res.status(401).json({ 
          success: false,
          error: 'Current password is incorrect',
          message: 'Het huidige wachtwoord is onjuist'
        });
      }

      // Update password
      const updated = await Auth.updatePassword(gebruikersId, newPassword);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update password'
        });
      }

      res.json({
        success: true,
        message: 'Wachtwoord succesvol gewijzigd'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to change password',
        message: 'Er ging iets mis bij het wijzigen van het wachtwoord'
      });
    }
  },

  // 🚪 LOGOUT - NIEUWE FUNCTIONALITEIT
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout succesvol'
    });
  }
};

module.exports = authController;