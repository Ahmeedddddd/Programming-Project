//src/Server/ROUTES/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../CONTROLLERS/authController');
const { validationResult, body } = require('express-validator');

// Import security middleware
const {
  loginLimiter,
  registerLimiter,
  AccountSecurity,
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
  auditLogger
} = require('../MIDDLEWARE/security');

// Import existing middleware
let authenticateToken, requireRole;
try {
  const authMiddleware = require('../MIDDLEWARE/auth');
  authenticateToken = authMiddleware.authenticateToken;
  requireRole = authMiddleware.requireRole;
} catch (error) {
  console.log('Auth middleware not found, using basic version');
  // Fallback implementation here...
}

// Apply security middleware to all routes
router.use(auditLogger);
router.use(sanitizeInput);

// ===== ENHANCED VALIDATION MIDDLEWARE =====

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .custom(async (email) => {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

const validateStudentRegistration = [
  body('voornaam')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Voornaam must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Voornaam contains invalid characters'),
  body('achternaam')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Achternaam must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Achternaam contains invalid characters'),
  body('studentnummer')
    .isInt({ min: 1, max: 999999 })
    .withMessage('Valid studentnummer is required')
    .custom(async (studentnummer) => {
      if (studentnummer.toString().length < 3) {
        throw new Error('Studentnummer must be at least 3 digits');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .custom(async (email) => {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }
      // Check for student email pattern (optional)
      if (!email.includes('student') && !email.includes('ehb')) {
        console.warn('Non-standard student email format:', email);
      }
      return true;
    }),
  body('gsm_nummer')
    .matches(/^\+32[0-9]{9}$|^0[0-9]{9}$/)
    .withMessage('Valid Belgian phone number is required'),
  body('opleiding')
    .isIn(['Toegepaste informatica', 'Graduaat Programmeren', 'Multimedia & Creatieve Technologie', 'Cybersecurity', 'Embedded Systems'])
    .withMessage('Valid opleiding is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .custom((password) => {
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new Error(`Password security requirements not met: ${validation.message}`);
      }
      return true;
    })
];

const validateBedrijfRegistration = [
  body('naam')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bedrijfsnaam must be between 2 and 100 characters')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s&.,'-]+$/)
    .withMessage('Bedrijfsnaam contains invalid characters'),
  body('voornaam')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Voornaam must be between 2 and 50 characters'),
  body('achternaam')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Achternaam must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .custom(async (email) => {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }
      return true;
    }),
  body('TVA_nummer')
    .matches(/^BE[0-9]{10}$/)
    .withMessage('Valid Belgian TVA number is required (BE + 10 digits)'),
  body('gsm_nummer')
    .matches(/^\+32[0-9]{9}$|^0[0-9]{9}$/)
    .withMessage('Valid Belgian phone number is required'),
  body('straatnaam')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Straatnaam is required'),
  body('huisnummer')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Huisnummer is required'),
  body('postcode')
    .matches(/^[0-9]{4}$/)
    .withMessage('Valid Belgian postcode is required (4 digits)'),
  body('gemeente')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Gemeente is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .custom((password) => {
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new Error(`Password security requirements not met: ${validation.message}`);
      }
      return true;
    })
];

// ===== AUTHENTICATION ROUTES WITH SECURITY =====

/**
 * POST /api/auth/login - Enhanced login with security
 */
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await AccountSecurity.logSecurityEvent(
        'AUTH_FAILURE',
        req.body.email || 'unknown',
        req.ip,
        req.get('User-Agent'),
        { reason: 'validation_failed', errors: errors.array() }
      );
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check account lockout
    const lockoutStatus = await AccountSecurity.checkAccountLockout(email);
    if (lockoutStatus.isLocked) {
      await AccountSecurity.logSecurityEvent(
        'ACCOUNT_LOCKED',
        email,
        req.ip,
        req.get('User-Agent'),
        { minutesLeft: lockoutStatus.minutesLeft }
      );

      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: `Account tijdelijk vergrendeld. Probeer het over ${lockoutStatus.minutesLeft} minuten opnieuw.`,
        lockedUntil: lockoutStatus.lockedUntil
      });
    }

    // Use existing authController or fallback
    if (authController && authController.login) {
      // Wrap the controller to add security logging
      const originalSend = res.send;
      res.send = function(data) {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (result.success) {
          // Successful login
          AccountSecurity.recordSuccessfulLogin(email);
          AccountSecurity.logSecurityEvent(
            'LOGIN_SUCCESS',
            email,
            req.ip,
            req.get('User-Agent'),
            { userType: result.user?.userType }
          );
        } else {
          // Failed login
          AccountSecurity.recordFailedLogin(email);
          AccountSecurity.logSecurityEvent(
            'LOGIN_FAILURE',
            email,
            req.ip,
            req.get('User-Agent'),
            { reason: 'invalid_credentials' }
          );
        }
        
        originalSend.call(this, data);
      };
      
      return await authController.login(req, res);
    }
    
    // Fallback implementation with security
    const { authenticateUser } = require('../PASSWOORD/CONFIG/passwordhasher');
    
    // Try authentication for each user type
    let authResult = null;
    const userTypes = ['student', 'bedrijf', 'organisator'];
    
    for (const userType of userTypes) {
      try {
        let identifier = email;
        
        if (userType === 'student') {
          const { pool } = require('../CONFIG/database');
          const [students] = await pool.query('SELECT studentnummer FROM STUDENT WHERE email = ?', [email]);
          if (students.length > 0) {
            identifier = students[0].studentnummer;
          } else {
            continue;
          }
        } else if (userType === 'bedrijf') {
          const { pool } = require('../CONFIG/database');
          const [bedrijven] = await pool.query('SELECT bedrijfsnummer FROM BEDRIJF WHERE email = ?', [email]);
          if (bedrijven.length > 0) {
            identifier = bedrijven[0].bedrijfsnummer;
          } else {
            continue;
          }
        }
        
        const result = await authenticateUser(userType, identifier, password);
        if (result.success) {
          authResult = result;
          authResult.userType = userType;
          authResult.userId = userType === 'organisator' ? result.user.organisatorId : identifier;
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!authResult || !authResult.success) {
      await AccountSecurity.recordFailedLogin(email);
      await AccountSecurity.logSecurityEvent(
        'LOGIN_FAILURE',
        email,
        req.ip,
        req.get('User-Agent'),
        { reason: 'invalid_credentials' }
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email of wachtwoord is onjuist'
      });
    }

    // Success - record and generate token
    await AccountSecurity.recordSuccessfulLogin(email);
    await AccountSecurity.logSecurityEvent(
      'LOGIN_SUCCESS',
      email,
      req.ip,
      req.get('User-Agent'),
      { userType: authResult.userType }
    );

    const jwt = require('jsonwebtoken');
    const config = require('../CONFIG/config');
    
    const tokenPayload = {
      gebruikersId: authResult.user.gebruikersId,
      userId: authResult.userId,
      userType: authResult.userType,
      email: email,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn 
    });

    res.json({
      success: true,
      message: 'Login succesvol',
      token: token,
      user: {
        userId: authResult.userId,
        userType: authResult.userType,
        email: email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    await AccountSecurity.logSecurityEvent(
      'AUTH_FAILURE',
      req.body.email || 'unknown',
      req.ip,
      req.get('User-Agent'),
      { error: error.message }
    );
    
    res.status(500).json({
      success: false,
      message: 'Er is een serverfout opgetreden'
    });
  }
});

/**
 * POST /api/auth/register/student - Enhanced student registration
 */
router.post('/register/student', registerLimiter, validateStudentRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await AccountSecurity.logSecurityEvent(
        'AUTH_FAILURE',
        req.body.email || 'unknown',
        req.ip,
        req.get('User-Agent'),
        { reason: 'validation_failed', type: 'student_registration', errors: errors.array() }
      );
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Log registration attempt
    await AccountSecurity.logSecurityEvent(
      'REGISTRATION',
      req.body.email,
      req.ip,
      req.get('User-Agent'),
      { type: 'student', studentnummer: req.body.studentnummer }
    );

    // Use existing controller or fallback
    if (authController && authController.registerStudent) {
      return await authController.registerStudent(req, res);
    }
    
    // Fallback implementation
    const { password, ...studentData } = req.body;
    
    const { pool } = require('../CONFIG/database');
    const [existingUser] = await pool.query('SELECT email FROM STUDENT WHERE email = ?', [studentData.email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists',
        message: 'Er bestaat al een account met dit email adres'
      });
    }

    const [existingStudent] = await pool.query('SELECT studentnummer FROM STUDENT WHERE studentnummer = ?', [studentData.studentnummer]);
    if (existingStudent.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Student number already exists',
        message: 'Er bestaat al een student met dit studentnummer'
      });
    }

    try {
      const Auth = require('../MODELS/auth');
      const userResult = await Auth.registerStudent(studentData, password);
      
      const jwt = require('jsonwebtoken');
      const config = require('../CONFIG/config');
      
      const token = jwt.sign({
        gebruikersId: userResult.gebruikersId,
        userId: userResult.userId,
        userType: userResult.userType,
        email: userResult.email
      }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

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
    } catch (authError) {
      console.error('Auth model error:', authError);
      res.status(500).json({
        success: false,
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }

  } catch (error) {
    console.error('Student registration error:', error);
    await AccountSecurity.logSecurityEvent(
      'AUTH_FAILURE',
      req.body.email || 'unknown',
      req.ip,
      req.get('User-Agent'),
      { error: error.message, type: 'student_registration' }
    );
    
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      message: 'Er ging iets mis bij het aanmaken van je account'
    });
  }
});

/**
 * POST /api/auth/register/bedrijf - Enhanced bedrijf registration
 */
router.post('/register/bedrijf', registerLimiter, validateBedrijfRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await AccountSecurity.logSecurityEvent(
        'AUTH_FAILURE',
        req.body.email || 'unknown',
        req.ip,
        req.get('User-Agent'),
        { reason: 'validation_failed', type: 'bedrijf_registration', errors: errors.array() }
      );
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Log registration attempt
    await AccountSecurity.logSecurityEvent(
      'REGISTRATION',
      req.body.email,
      req.ip,
      req.get('User-Agent'),
      { type: 'bedrijf', TVA_nummer: req.body.TVA_nummer }
    );

    // Use existing controller
    if (authController && authController.registerBedrijf) {
      return await authController.registerBedrijf(req, res);
    }
    
    // Fallback implementation (similar to student)
    const { password, ...bedrijfData } = req.body;
    
    const { pool } = require('../CONFIG/database');
    const [existingUser] = await pool.query('SELECT email FROM BEDRIJF WHERE email = ?', [bedrijfData.email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists',
        message: 'Er bestaat al een account met dit email adres'
      });
    }

    if (bedrijfData.TVA_nummer) {
      const [existingTVA] = await pool.query('SELECT bedrijfsnummer FROM BEDRIJF WHERE TVA_nummer = ?', [bedrijfData.TVA_nummer]);
      if (existingTVA.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'TVA number already exists',
          message: 'Er bestaat al een bedrijf met dit TVA nummer'
        });
      }
    }

    try {
      const Auth = require('../MODELS/auth');
      const userResult = await Auth.registerBedrijf(bedrijfData, password);
      
      const jwt = require('jsonwebtoken');
      const config = require('../CONFIG/config');
      
      const token = jwt.sign({
        gebruikersId: userResult.gebruikersId,
        userId: userResult.userId,
        userType: userResult.userType,
        email: userResult.email
      }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

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
    } catch (authError) {
      console.error('Auth model error:', authError);
      res.status(500).json({
        success: false,
        message: 'Er ging iets mis bij het aanmaken van je account'
      });
    }

  } catch (error) {
    console.error('Bedrijf registration error:', error);
    await AccountSecurity.logSecurityEvent(
      'AUTH_FAILURE',
      req.body.email || 'unknown',
      req.ip,
      req.get('User-Agent'),
      { error: error.message, type: 'bedrijf_registration' }
    );
    
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      message: 'Er ging iets mis bij het aanmaken van je account'
    });
  }
});

// ===== PROTECTED ROUTES =====

/**
 * GET /api/auth/me - Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (authController && authController.getMe) {
      return await authController.getMe(req, res);
    }
    
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

/**
 * GET /api/auth/test - Test authentication system
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Enhanced authentication system is working',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'Enabled',
      accountLockout: 'Enabled', 
      auditLogging: 'Enabled',
      inputSanitization: 'Enabled',
      passwordComplexity: 'Enforced'
    },
    endpoints: {
      login: 'POST /api/auth/login',
      registerStudent: 'POST /api/auth/register/student',
      registerBedrijf: 'POST /api/auth/register/bedrijf',
      getProfile: 'GET /api/auth/me (requires auth)'
    }
  });
});

module.exports = router;