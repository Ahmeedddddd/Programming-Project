// src/Server/CONTROLLERS/authController.js

const Auth = require('../MODELS/auth');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../CONFIG/database');
const config = require('../CONFIG/config');
const bcrypt = require('bcrypt');

const authController = {

  // 🔐 EMAIL-FIRST LOGIN - FIXED
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
      console.log(`🔐 Login attempt for email: ${email}`);

      // 🎯 FIXED: Use authController instead of this
      const userResult = await authController.findUserByEmailAndValidatePassword(email, password);
      
      if (!userResult.success) {
        console.log(`❌ Authentication failed: ${userResult.message}`);
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: userResult.message || 'Email of wachtwoord is onjuist'
        });
      }

      console.log(`✅ Authentication successful for ${userResult.user.email}`);

      // 🎫 Generate JWT token - CONSISTENT payload
      const tokenPayload = {
        email: userResult.user.email,
        userType: userResult.user.userType,
        userId: userResult.user.userId, 
        gebruikersId: userResult.user.gebruikersId,
        naam: userResult.user.naam
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn || '7d'
      });

      // ✅ CONSISTENT response format
      res.json({
        success: true,
        message: 'Login succesvol',
        token: token,
        user: {
          email: userResult.user.email,
          userType: userResult.user.userType,
          userId: userResult.user.userId,
          naam: userResult.user.naam,
          ...userResult.user
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

  // 🔍 MAIN EMAIL-TO-USER LOOKUP WITH PASSWORD VALIDATION - FIXED
  async findUserByEmailAndValidatePassword(email, password) {
    try {
      let userInfo = null;

      // 1. Check STUDENT table with JOIN to LOGINBEHEER
      const [students] = await pool.query(`
        SELECT 
          s.*, 
          lb.gebruikersId, 
          lb.passwoord_hash,
          s.studentnummer as userId,
          'student' as userType
        FROM STUDENT s
        JOIN LOGINBEHEER lb ON lb.studentnummer = s.studentnummer
        WHERE s.email = ?
      `, [email]);

      if (students.length > 0) {
        userInfo = {
          ...students[0],
          naam: `${students[0].voornaam} ${students[0].achternaam}`
        };
      }

      // 2. Check BEDRIJF table with JOIN to LOGINBEHEER if not found
      if (!userInfo) {
        const [bedrijven] = await pool.query(`
          SELECT 
            b.*, 
            lb.gebruikersId, 
            lb.passwoord_hash,
            b.bedrijfsnummer as userId,
            'bedrijf' as userType
          FROM BEDRIJF b
          JOIN LOGINBEHEER lb ON lb.bedrijfsnummer = b.bedrijfsnummer
          WHERE b.email = ?
        `, [email]);

        if (bedrijven.length > 0) {
          userInfo = bedrijven[0];
        }
      }

      // 3. Check ORGANISATOR table with JOIN to LOGINBEHEER if not found
      if (!userInfo) {
        const [organisators] = await pool.query(`
          SELECT 
            o.*, 
            lb.gebruikersId, 
            lb.passwoord_hash,
            o.organisatorId as userId,
            'organisator' as userType
          FROM ORGANISATOR o
          JOIN LOGINBEHEER lb ON lb.gebruikersId = o.gebruikersId
          WHERE o.email = ?
        `, [email]);

        if (organisators.length > 0) {
          userInfo = {
            ...organisators[0],
            naam: `${organisators[0].voornaam} ${organisators[0].achternaam}`
          };
        }
      }

      if (!userInfo) {
        return { 
          success: false, 
          message: 'Geen account gevonden met dit email adres' 
        };
      }

      // 4. Verify password
      const isPasswordValid = await bcrypt.compare(password, userInfo.passwoord_hash);

      if (!isPasswordValid) {
        return { 
          success: false, 
          message: 'Onjuist wachtwoord' 
        };
      }

      // 5. Return success with all user data
      return {
        success: true,
        user: userInfo
      };

    } catch (error) {
      console.error('Error in findUserByEmailAndValidatePassword:', error);
      return { 
        success: false, 
        message: 'Er ging iets mis bij de authenticatie' 
      };
    }
  },

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

      // FIXED: Use authController instead of this
      const existingUser = await authController.checkEmailExists(studentData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Register student using existing Auth model
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

      res.status(201).json({
        success: true,
        message: 'Student account succesvol aangemaakt',
        token: token,
        user: {
          email: studentData.email,
          userType: 'student',
          userId: userResult.userId,
          naam: `${studentData.voornaam} ${studentData.achternaam}`
        }
      });

    } catch (error) {
      console.error('Student registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }
  },

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

      // FIXED: Use authController instead of this
      const existingUser = await authController.checkEmailExists(bedrijfData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Register bedrijf using existing Auth model
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

      res.status(201).json({
        success: true,
        message: 'Bedrijf account succesvol aangemaakt',
        token: token,
        user: {
          email: bedrijfData.email,
          userType: 'bedrijf',
          userId: userResult.userId,
          naam: bedrijfData.naam
        }
      });

    } catch (error) {
      console.error('Bedrijf registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }
  },

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

      // FIXED: Use authController instead of this
      const existingUser = await authController.checkEmailExists(organisatorData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // Register organisator using existing Auth model
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

      res.status(201).json({
        success: true,
        message: 'Organisator account succesvol aangemaakt',
        token: token,
        user: {
          email: organisatorData.email,
          userType: 'organisator',
          userId: userResult.userId,
          naam: `${organisatorData.voornaam} ${organisatorData.achternaam}`
        }
      });

    } catch (error) {
      console.error('Organisator registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed',
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
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

      // Get current user data to verify current password
      const [users] = await pool.query(
        'SELECT passwoord_hash FROM LOGINBEHEER WHERE gebruikersId = ?',
        [gebruikersId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'Gebruiker niet gevonden'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].passwoord_hash);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid current password',
          message: 'Huidig wachtwoord is onjuist'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await pool.query(
        'UPDATE LOGINBEHEER SET passwoord_hash = ? WHERE gebruikersId = ?',
        [newHashedPassword, gebruikersId]
      );

      console.log(`✅ Password changed successfully for user: ${email}`);

      res.json({
        success: true,
        message: 'Wachtwoord succesvol gewijzigd'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to change password',
        message: 'Er ging iets mis bij het wijzigen van je wachtwoord'
      });
    }
  },

  async checkEmailExists(email) {
    try {
      const [students] = await pool.query('SELECT email FROM STUDENT WHERE email = ?', [email]);
      if (students.length > 0) return true;

      const [bedrijven] = await pool.query('SELECT email FROM BEDRIJF WHERE email = ?', [email]);
      if (bedrijven.length > 0) return true;

      const [organisators] = await pool.query('SELECT email FROM ORGANISATOR WHERE email = ?', [email]);
      if (organisators.length > 0) return true;

      return false;
    } catch (error) {
      console.error('Error checking email exists:', error);
      return false;
    }
  },

  async getMe(req, res) {
    try {
      const { email, userType } = req.user;

      // FIXED: Use authController instead of this
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