//src/Server/CONTROLLERS/authController.js

const Auth = require('../MODELS/auth');
const { authenticateUser } = require('../PASSWOORD/CONFIG/passwordhasher');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../CONFIG/database');
const config = require('../CONFIG/config');
const PasswordManager = require('../PASSWORD/passwordManager');
const passwordManager = new PasswordManager();

// Import nieuwe services
const vatValidationService = require('../SERVICES/vatValidationService');
const handlebarsEmailService = require('../SERVICES/handlebarsEmailService');
const { AccountSecurity } = require('../MIDDLEWARE/security');

const authController = {

  // 🔐 LOGIN - BESTAANDE FUNCTIE (ongewijzigd)
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

      // Eerst bepalen welk type user dit is
      const user = await Auth.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: 'Email of wachtwoord is onjuist'
        });
      }

      // Gebruik bestaande authenticateUser functie
      let identifier = user.userType === 'organisator' ? email : user.id;
      const authResult = await authenticateUser(user.userType, identifier, password);
      
      if (!authResult.success) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials',
          message: authResult.message
        });
      }

      // Generate JWT token
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

  // 📝 REGISTER STUDENT - UPDATED met Handlebars Email
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

      console.log('🎓 Registering new student:', studentData.email);

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

      // 📧 Verstuur welcome email met Handlebars
      try {
        const emailResult = await handlebarsEmailService.sendStudentWelcomeEmail({
          voornaam: studentData.voornaam,
          achternaam: studentData.achternaam,
          studentnummer: studentData.studentnummer,
          email: userResult.email || studentData.email,
          opleiding: studentData.opleiding,
          opleidingsrichting: studentData.opleidingsrichting || ''
        });
        
        if (emailResult.success) {
          console.log('✅ Student welcome email sent successfully');
        } else {
          console.warn('⚠️ Failed to send student welcome email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('📧 Email sending error:', emailError);
        // Don't fail registration if email fails
      }

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

  // 🏢 REGISTER BEDRIJF - UPDATED met VAT validatie + Handlebars Email
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

      console.log('🏢 Registering new bedrijf:', bedrijfData.naam);

      // Check if email already exists
      const existingUser = await Auth.findUserByEmail(bedrijfData.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already exists',
          message: 'Er bestaat al een account met dit email adres'
        });
      }

      // 🔍 VAT nummer validatie via externe API
      let vatValidationResult = null;
      if (bedrijfData.TVA_nummer) {
        console.log('🔍 Validating VAT number:', bedrijfData.TVA_nummer);
        
        try {
          vatValidationResult = await vatValidationService.validateVATNumber(bedrijfData.TVA_nummer);
          
          if (!vatValidationResult.isValid && !vatValidationResult.fallback) {
            return res.status(400).json({
              success: false,
              error: 'Invalid VAT number',
              message: 'Het opgegeven TVA nummer is niet geldig',
              vatError: vatValidationResult.message
            });
          }

          // Log VAT validatie resultaat
          if (vatValidationResult.isValid) {
            console.log('✅ VAT number validated successfully');
            if (vatValidationResult.companyName) {
              console.log(`📋 Company name from VAT: ${vatValidationResult.companyName}`);
            }
          } else if (vatValidationResult.fallback) {
            console.log('⚠️ VAT validation used fallback (API unavailable)');
          }

        } catch (vatError) {
          console.error('❌ VAT validation error:', vatError);
          // Continue met registratie als VAT API niet beschikbaar is
          vatValidationResult = { fallback: true, message: 'VAT API temporarily unavailable' };
        }

        // Check if TVA number already exists in database
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

      // 📧 Verstuur welcome email met Handlebars en VAT info
      try {
        const emailData = {
          naam: bedrijfData.naam,
          voornaam: bedrijfData.voornaam || 'Contactpersoon',
          achternaam: bedrijfData.achternaam || '',
          email: userResult.email || bedrijfData.email,
          TVA_nummer: bedrijfData.TVA_nummer,
          sector: bedrijfData.sector || '',
          gemeente: bedrijfData.gemeente,
          straatnaam: bedrijfData.straatnaam,
          huisnummer: bedrijfData.huisnummer,
          postcode: bedrijfData.postcode
        };

        const emailResult = await handlebarsEmailService.sendBedrijfWelcomeEmail(emailData, vatValidationResult);
        
        if (emailResult.success) {
          console.log('✅ Bedrijf welcome email sent successfully');
        } else {
          console.warn('⚠️ Failed to send bedrijf welcome email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('📧 Email sending error:', emailError);
        // Don't fail registration if email fails
      }

      // Log VAT validation voor audit trail
      if (vatValidationResult) {
        try {
          await AccountSecurity.logSecurityEvent(
            'VAT_VALIDATION',
            bedrijfData.email,
            req.ip,
            req.get('User-Agent'),
            {
              vatNumber: bedrijfData.TVA_nummer,
              isValid: vatValidationResult.isValid,
              companyName: vatValidationResult.companyName,
              fallback: vatValidationResult.fallback
            }
          );
        } catch (logError) {
          console.error('Failed to log VAT validation:', logError);
        }
      }

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

      // Response met VAT informatie
      const responseData = {
        success: true,
        message: 'Bedrijf account succesvol aangemaakt',
        token: token,
        user: {
          userId: userResult.userId,
          userType: userResult.userType,
          email: userResult.email
        }
      };

      // Voeg VAT informatie toe aan response
      if (vatValidationResult) {
        responseData.vatValidation = {
          isValid: vatValidationResult.isValid,
          companyName: vatValidationResult.companyName,
          fallback: vatValidationResult.fallback
        };
      }

      res.status(201).json(responseData);

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

  // 👔 REGISTER ORGANISATOR - BESTAANDE FUNCTIE (ongewijzigd)
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

  // ✅ GET ME - BESTAANDE FUNCTIE (ongewijzigd)
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

// 🔐 CHANGE PASSWORD - UPDATED met PasswordManager en stored procedure
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

    console.log(`🔐 Password change request for user ${gebruikersId} (${email})`);

    // Validatie
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Huidig en nieuw wachtwoord zijn verplicht'
      });
    }
    
    // Controleer of nieuwe wachtwoord anders is dan huidige
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Same password',
        message: 'Nieuw wachtwoord moet verschillen van het huidige wachtwoord'
      });
    }

    // ✅ Controleer huidig wachtwoord via PasswordManager
    const isCurrentPasswordValid = await passwordManager.verifyCurrentPassword(
      gebruikersId, 
      currentPassword
    );
    
    if (!isCurrentPasswordValid) {
      console.log(`❌ Invalid current password for user ${gebruikersId}`);
      
      // Log failed password change attempt
      try {
        await AccountSecurity.logSecurityEvent(
          'PASSWORD_CHANGE_FAILED',
          email,
          req.ip,
          req.get('User-Agent'),
          { reason: 'Invalid current password' }
        );
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect',
        message: 'Het huidige wachtwoord is onjuist'
      });
    }
    
    // ✅ Controleer of wachtwoord recent gebruikt is
    const isPasswordReused = await passwordManager.checkPasswordReuse(
      gebruikersId, 
      newPassword
    );
    
    if (isPasswordReused) {
      console.log(`⚠️  Password reuse detected for user ${gebruikersId}`);
      
      // Log password reuse attempt
      try {
        await AccountSecurity.logSecurityEvent(
          'PASSWORD_REUSE_BLOCKED',
          email,
          req.ip,
          req.get('User-Agent'),
          { gebruikersId: gebruikersId }
        );
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Password reuse detected',
        message: 'Dit wachtwoord is recent gebruikt. Kies een ander wachtwoord.'
      });
    }
    
    // 🚀 Update wachtwoord via PasswordManager (stored procedure call gebeurt hier!)
    const result = await passwordManager.updatePassword(gebruikersId, newPassword);
    
    if (result.success) {
      console.log(`✅ Password successfully changed for user ${gebruikersId}`);
      
      // Log successful password change
      try {
        await AccountSecurity.logSecurityEvent(
          'PASSWORD_CHANGED',
          email,
          req.ip,
          req.get('User-Agent'),
          { 
            gebruikersId: gebruikersId,
            timestamp: new Date().toISOString()
          }
        );
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      res.json({
        success: true,
        message: 'Wachtwoord succesvol gewijzigd'
      });
    } else {
      console.log(`❌ Password change failed for user ${gebruikersId}: ${result.message}`);
      res.status(500).json({
        success: false,
        error: 'Password update failed',
        message: result.message || 'Er ging iets mis bij het wijzigen van het wachtwoord'
      });
    }

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password',
      message: 'Er ging iets mis bij het wijzigen van het wachtwoord'
    });
  }
},

  // 🚪 LOGOUT - NIEUWE FUNCTIE
  async logout(req, res) {
    try {
      const { email, userType } = req.user;
      
      // Log de logout actie
      await AccountSecurity.logSecurityEvent(
        'LOGOUT',
        email,
        req.ip,
        req.get('User-Agent'),
        { userType: userType }
      );

      console.log(`🚪 User logged out: ${email} (${userType})`);

      res.json({
        success: true,
        message: 'Logout succesvol',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Logout error:', error);
      // Zelfs bij een error, return success omdat client-side logout altijd mogelijk is
      res.json({
        success: true,
        message: 'Logout succesvol (client-side)',
        warning: 'Server-side logout had issues but client logout should proceed'
      });
    }
  },

  // 🔍 VAT Validation Endpoint (voor frontend)
  async validateVAT(req, res) {
    try {
      const { vatNumber } = req.body;
      
      if (!vatNumber) {
        return res.status(400).json({
          success: false,
          error: 'VAT number required',
          message: 'VAT nummer is verplicht'
        });
      }

      const result = await vatValidationService.validateVATNumber(vatNumber);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('VAT validation endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'VAT validation failed',
        message: 'VAT validatie is momenteel niet beschikbaar'
      });
    }
  },

  // 📧 NEW: Test Email Endpoint (voor development)
  async sendTestEmail(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email address required'
        });
      }

      const result = await handlebarsEmailService.sendTestEmail(email);
      
      res.json({
        success: result.success,
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        data: result
      });

    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        message: error.message
      });
    }
  }
};

module.exports = authController;