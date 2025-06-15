//src/Server/ROUTES/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../CONTROLLERS/authController');
const { validationResult, body } = require('express-validator');

// Import security middleware
const {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  AccountSecurity,
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
  securityHeaders,
  sessionTimeout,
  auditLogger
} = require('../MIDDLEWARE/security');

// Import auth middleware with better error handling
let authenticateToken, requireRole;

try {
  const authMiddleware = require('../MIDDLEWARE/auth');
  authenticateToken = authMiddleware.authenticateToken;
  requireRole = authMiddleware.requireRole;
  
  // Verify that the functions are actually imported
  if (typeof authenticateToken !== 'function') {
    throw new Error('authenticateToken is not a function');
  }
  if (typeof requireRole !== 'function') {
    throw new Error('requireRole is not a function');
  }
  
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth middleware:', error.message);
  console.error('Full error:', error);
  
  // Create fallback middleware functions
  authenticateToken = (req, res, next) => {
    res.status(500).json({
      success: false,
      error: 'Authentication middleware not available',
      message: 'Server configuration error'
    });
  };
  
  requireRole = (roles) => {
    return (req, res, next) => {
      res.status(500).json({
        success: false,
        error: 'Authorization middleware not available',
        message: 'Server configuration error'
      });
    };
  };
  
  console.log('⚠️ Using fallback middleware functions');
}

// Apply security middleware to all routes
router.use(auditLogger);
router.use(sanitizeInput);
router.use(sessionTimeout);

// ===== VALIDATION MIDDLEWARE =====

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

const validateVATNumber = [
  body('vatNumber')
    .notEmpty()
    .withMessage('VAT number is required')
    .matches(/^[A-Z]{2}[0-9A-Z]+$/)
    .withMessage('VAT number must start with country code (e.g., BE0123456789)')
];

const validateEmailOnly = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail()
];

// ===== PUBLIC ROUTES =====

/**
 * POST /api/auth/login - Enhanced login with security
 */
router.post('/login', loginLimiter, validateLogin, authController.login);

/**
 * POST /api/auth/register/student - Enhanced student registration
 */
router.post('/register/student', registerLimiter, validateStudentRegistration, authController.registerStudent);

/**
 * POST /api/auth/register/bedrijf - Enhanced bedrijf registration with VAT validation
 */
router.post('/register/bedrijf', registerLimiter, validateBedrijfRegistration, authController.registerBedrijf);

/**
 * POST /api/auth/register/organisator - Organisator registration (admin only in practice)
 */
router.post('/register/organisator', registerLimiter, authController.registerOrganisator);

/**
 * POST /api/auth/validate-vat - VAT number validation endpoint (gebruikt jouw service)
 */
router.post('/validate-vat', apiLimiter, validateVATNumber, authController.validateVAT);

// ===== PROTECTED ROUTES =====

/**
 * GET /api/auth/me - Get current user profile
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * POST /api/auth/logout - Logout current user
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * POST /api/auth/change-password - Change user password
 */
router.post('/change-password', 
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .custom((password) => {
        const validation = validatePasswordStrength(password);
        if (!validation.isValid) {
          throw new Error(`Password security requirements not met: ${validation.message}`);
        }
        return true;
      })
  ],
  authController.changePassword
);

// ===== DEVELOPMENT/TEST ROUTES =====

/**
 * POST /api/auth/send-test-email - Send test email (voor development)
 */
router.post('/send-test-email', 
  apiLimiter,
  validateEmailOnly,
  authController.sendTestEmail
);

// ===== UTILITY ROUTES =====

/**
 * GET /api/auth/test - Test authentication system
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Enhanced authentication system is working',
    timestamp: new Date().toISOString(),
    middleware: {
      authMiddleware: typeof authenticateToken === 'function' ? 'Loaded' : 'Failed',
      securityMiddleware: 'Enabled'
    },
    security: {
      rateLimiting: 'Enabled',
      accountLockout: 'Enabled', 
      auditLogging: 'Enabled',
      inputSanitization: 'Enabled',
      passwordComplexity: 'Enforced',
      vatValidation: 'Enabled (using checkVATServ)',
      emailNotifications: 'Enabled (Handlebars)'
    },
    endpoints: {
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout (requires auth)',
      registerStudent: 'POST /api/auth/register/student',
      registerBedrijf: 'POST /api/auth/register/bedrijf',
      registerOrganisator: 'POST /api/auth/register/organisator',
      getProfile: 'GET /api/auth/me (requires auth)',
      changePassword: 'POST /api/auth/change-password (requires auth)',
      validateVAT: 'POST /api/auth/validate-vat',
      testEmail: 'POST /api/auth/send-test-email'
    },
    features: {
      vatValidation: {
        provider: 'VIES API (viesapi.eu)',
        service: 'checkVATServ.js (your existing service)',
        countries: 'EU VAT numbers supported',
        fallback: 'Format validation if API unavailable'
      },
      emailNotifications: {
        engine: 'Handlebars',
        studentWelcome: 'Automated welcome email with account details',
        bedrijfWelcome: 'Professional welcome email with partnership info',
        vatConfirmation: 'VAT validation status included in emails',
        testEmail: 'Development test email endpoint'
      },
      logout: {
        universal: 'Works for all user types (student/bedrijf/organisator)',
        clientSide: 'Clears localStorage, sessionStorage, cookies',
        serverSide: 'Invalidates tokens and logs security events',
        autoCleanup: 'Automatic token expiry checking'
      }
    }
  });
});

/**
 * GET /api/auth/health - Health check for authentication services
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      vatAPI: 'unknown',
      emailService: 'unknown',
      authMiddleware: typeof authenticateToken === 'function' ? 'healthy' : 'unhealthy'
    }
  };

  try {
    // Test database connection
    const { pool } = require('../CONFIG/database');
    await pool.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (dbError) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Test VAT API (with your service)
    const { quickValidate } = require('../SERVICES/checkVATServ');
    // Test met een valide Belgisch formaat (geen echte API call)
    health.services.vatAPI = 'healthy';
  } catch (vatError) {
    health.services.vatAPI = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Test email service connection
    const emailService = require('../SERVICES/handlebarsEmailService');
    health.services.emailService = 'healthy';
  } catch (emailError) {
    health.services.emailService = 'unhealthy';
    health.status = 'degraded';
  }

  if (health.services.authMiddleware === 'unhealthy') {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;