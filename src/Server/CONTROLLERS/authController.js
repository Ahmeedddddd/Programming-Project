// src/Server/CONTROLLERS/authController.js

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../CONFIG/database');
const config = require('../CONFIG/config');

// 🔐 USE NEW UNIFIED PASSWORD MANAGER (replaces all old password utilities)
const { passwordManager } = require('../PASSWOORD/passwordManager');

const authController = {

  // 🔐 SIMPLIFIED LOGIN using unified password manager
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;
      console.log(`🔐 Login attempt for email: ${email}`);

      // 🎯 USE UNIFIED PASSWORD MANAGER
      const authResult = await passwordManager.authenticateUser(email, password);
      
      if (!authResult.success) {
        console.log(`❌ Authentication failed: ${authResult.message}`);
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: authResult.message
        });
      }

      console.log(`✅ Authentication successful for ${email}`);

      // Generate JWT token
      const tokenPayload = {
        email: authResult.user.email,
        userType: authResult.user.userType,
        userId: authResult.user.userId, 
        gebruikersId: authResult.user.gebruikersId,
        naam: authResult.user.naam || authResult.user.email
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn || '7d'
      });

      console.log(`🎫 Token generated for ${email} (${authResult.user.userType})`);

      // Send response
      res.json({
        success: true,
        message: 'Login succesvol',
        token: token,
        user: {
          email: authResult.user.email,
          userType: authResult.user.userType,
          userId: authResult.user.userId,
          naam: authResult.user.naam || authResult.user.email,
          gebruikersId: authResult.user.gebruikersId
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Login failed',
        message: 'Er ging iets mis bij het inloggen'
      });
    }
  },

  // 🔄 SIMPLIFIED PASSWORD CHANGE using unified password manager
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

      console.log(`🔄 Password change request for user: ${email}`);

      // 🎯 USE UNIFIED PASSWORD MANAGER
      const updateResult = await passwordManager.updatePassword(
        gebruikersId, 
        newPassword, 
        currentPassword
      );

      if (!updateResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Password change failed',
          message: updateResult.message
        });
      }

      console.log(`✅ Password changed successfully for user: ${email}`);

      res.json({
        success: true,
        message: 'Wachtwoord succesvol gewijzigd'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to change password',
        message: 'Er ging iets mis bij het wijzigen van je wachtwoord'
      });
    }
  },

  // 📧 FIXED EMAIL CHECK - Direct database query instead of passwordManager
  async checkEmailExists(email) {
    try {
      // Check in STUDENT table
      const [students] = await pool.query('SELECT email FROM STUDENT WHERE email = ?', [email]);
      if (students.length > 0) return true;

      // Check in BEDRIJF table
      const [bedrijven] = await pool.query('SELECT email FROM BEDRIJF WHERE email = ?', [email]);
      if (bedrijven.length > 0) return true;

      // Check in ORGANISATOR table
      const [organisators] = await pool.query('SELECT email FROM ORGANISATOR WHERE email = ?', [email]);
      if (organisators.length > 0) return true;

      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },

  // ✅ FIXED STUDENT REGISTRATION
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

      // 🎯 FIXED EMAIL CHECK - Direct database query
      const emailExists = await authController.checkEmailExists(studentData.email);
      if (emailExists) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      console.log(`📝 Registering student: ${studentData.email}`);

      // Use Auth model for registration - no more passwordManager conflicts
      const Auth = require('../MODELS/auth');
      const userResult = await Auth.registerStudent(studentData, password);

      // Generate token for immediate login
      const tokenPayload = {
        email: studentData.email,
        userType: 'student',
        userId: userResult.userId,
        gebruikersId: userResult.gebruikersId,
        naam: `${studentData.voornaam} ${studentData.achternaam}`
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn || '7d'
      });

      console.log(`✅ Student registered successfully: ${studentData.email}`);

      res.status(201).json({
        success: true,
        message: 'Student account succesvol aangemaakt',
        token: token,
        user: {
          email: studentData.email,
          userType: 'student',
          userId: userResult.userId,
          naam: `${studentData.voornaam} ${studentData.achternaam}`,
          gebruikersId: userResult.gebruikersId
        }
      });

    } catch (error) {
      console.error('Student registration error:', error);
      
      // More specific error handling
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met dit email adres of telefoonnummer'
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }
  },

  // ✅ FIXED BEDRIJF REGISTRATION
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

      // 🎯 FIXED EMAIL CHECK - Direct database query
      const emailExists = await authController.checkEmailExists(bedrijfData.email);
      if (emailExists) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      console.log(`📝 Registering bedrijf: ${bedrijfData.email}`);

      // Use Auth model for registration - no more passwordManager conflicts
      const Auth = require('../MODELS/auth');
      const userResult = await Auth.registerBedrijf(bedrijfData, password);

      // Generate token for immediate login
      const tokenPayload = {
        email: bedrijfData.email,
        userType: 'bedrijf',
        userId: userResult.userId,
        gebruikersId: userResult.gebruikersId,
        naam: bedrijfData.naam
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn || '7d'
      });

      console.log(`✅ Bedrijf registered successfully: ${bedrijfData.email}`);

      res.status(201).json({
        success: true,
        message: 'Bedrijf account succesvol aangemaakt',
        token: token,
        user: {
          email: bedrijfData.email,
          userType: 'bedrijf',
          userId: userResult.userId,
          naam: bedrijfData.naam,
          gebruikersId: userResult.gebruikersId
        }
      });

    } catch (error) {
      console.error('Bedrijf registration error:', error);
      
      // More specific error handling
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met dit email adres, telefoonnummer of BTW nummer'
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }
  },

  // ✅ FIXED ORGANISATOR REGISTRATION
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

      // 🎯 FIXED EMAIL CHECK - Direct database query
      const emailExists = await authController.checkEmailExists(organisatorData.email);
      if (emailExists) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      console.log(`📝 Registering organisator: ${organisatorData.email}`);

      // Use Auth model for registration - no more passwordManager conflicts
      const Auth = require('../MODELS/auth');
      const userResult = await Auth.registerOrganisator(organisatorData, password);

      // Generate token for immediate login
      const tokenPayload = {
        email: organisatorData.email,
        userType: 'organisator',
        userId: userResult.userId,
        gebruikersId: userResult.gebruikersId,
        naam: `${organisatorData.voornaam} ${organisatorData.achternaam}`
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn || '7d'
      });

      console.log(`✅ Organisator registered successfully: ${organisatorData.email}`);

      res.status(201).json({
        success: true,
        message: 'Organisator account succesvol aangemaakt',
        token: token,
        user: {
          email: organisatorData.email,
          userType: 'organisator',
          userId: userResult.userId,
          naam: `${organisatorData.voornaam} ${organisatorData.achternaam}`,
          gebruikersId: userResult.gebruikersId
        }
      });

    } catch (error) {
      console.error('Organisator registration error:', error);
      
      // More specific error handling
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          success: false,
          error: 'Duplicate entry',
          message: 'Er bestaat al een account met dit email adres'
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }
  },

  async getMe(req, res) {
    try {
      const { email, userType } = req.user;

      const userResult = await authController.getUserDataByEmail(email, userType);
      
      if (!userResult) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: userResult
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data'
      });
    }
  },

  async getUserDataByEmail(email, userType) {
    try {
      if (userType === 'student') {
        const [students] = await pool.query('SELECT * FROM STUDENT WHERE email = ?', [email]);
        if (students.length > 0) {
          return {
            ...students[0],
            userType: 'student',
            userId: students[0].studentnummer,
            naam: `${students[0].voornaam} ${students[0].achternaam}`
          };
        }
      } else if (userType === 'bedrijf') {
        const [bedrijven] = await pool.query('SELECT * FROM BEDRIJF WHERE email = ?', [email]);
        if (bedrijven.length > 0) {
          return {
            ...bedrijven[0],
            userType: 'bedrijf',
            userId: bedrijven[0].bedrijfsnummer
          };
        }
      } else if (userType === 'organisator') {
        const [organisators] = await pool.query('SELECT * FROM ORGANISATOR WHERE email = ?', [email]);
        if (organisators.length > 0) {
          return {
            ...organisators[0],
            userType: 'organisator',
            userId: organisators[0].organisatorId,
            naam: `${organisators[0].voornaam} ${organisators[0].achternaam}`
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user data by email:', error);
      return null;
    }
  },

  async validateVAT(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { vatNumber } = req.body;

      try {
        // Try to use your existing VAT service
        const { quickValidate } = require('../SERVICES/checkVATServ');
        const vatResult = await quickValidate(vatNumber);
        
        res.json({
          success: true,
          vatNumber: vatNumber,
          valid: vatResult.valid,
          details: vatResult
        });
      } catch (vatServiceError) {
        console.error('VAT service error:', vatServiceError);
        
        // Fallback to basic format validation
        const isValidFormat = /^[A-Z]{2}[0-9A-Z]+$/.test(vatNumber);
        
        res.json({
          success: true,
          vatNumber: vatNumber,
          valid: isValidFormat,
          warning: 'VAT validation service unavailable, using format validation only',
          details: {
            format: isValidFormat ? 'valid' : 'invalid'
          }
        });
      }

    } catch (error) {
      console.error('VAT validation error:', error);
      res.status(500).json({ 
        success: false,
        error: 'VAT validation failed',
        message: 'Er ging iets mis bij het valideren van het BTW nummer'
      });
    }
  },

  async sendTestEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email } = req.body;

      try {
        // Try to use your email service
        const emailService = require('../SERVICES/handlebarsEmailService');
        
        const testData = {
          email: email,
          subject: 'Test Email - Authentication System',
          naam: 'Test User',
          timestamp: new Date().toISOString()
        };

        await emailService.sendTestEmail(testData);
        
        res.json({
          success: true,
          message: 'Test email verzonden',
          email: email
        });
      } catch (emailError) {
        console.error('Email service error:', emailError);
        res.status(500).json({
          success: false,
          error: 'Email service unavailable',
          message: 'Email service is momenteel niet beschikbaar'
        });
      }

    } catch (error) {
      console.error('Send test email error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send test email',
        message: 'Er ging iets mis bij het verzenden van de test email'
      });
    }
  },

  async logout(req, res) {
    try {
      const { email, userType } = req.user;
      console.log(`🚪 User logged out: ${email} (${userType})`);

      res.json({
        success: true,
        message: 'Logout succesvol'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.json({
        success: true,
        message: 'Logout succesvol'
      });
    }
  }
};

module.exports = authController;

console.log('🔐 AuthController FIXED - No more transaction conflicts');
console.log('✅ Direct database queries for email checking');