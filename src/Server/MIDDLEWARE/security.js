//src/Server/MIDDLEWARE/security.js

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const { pool } = require('../CONFIG/database');

// Rate limiting voor login pogingen
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 5, // Max 5 login pogingen per IP per 15 min
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Te veel login pogingen. Probeer het over 15 minuten opnieuw.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful logins
  skipSuccessfulRequests: true,
  // Custom key generator (kan IP + email combineren)
  keyGenerator: (req) => {
    return req.ip + (req.body?.email || '');
  }
});

// Rate limiting voor registratie
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 uur
  max: 3, // Max 3 registraties per IP per uur
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Te veel registratie pogingen. Probeer het over een uur opnieuw.'
  }
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 100, // Max 100 requests per IP per 15 min
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Te veel API verzoeken. Probeer het later opnieuw.'
  }
});

// Account lockout systeem
class AccountSecurity {
  static async checkAccountLockout(email) {
    try {
      const [rows] = await pool.query(`
        SELECT failed_attempts, locked_until, email 
        FROM LOGIN_SECURITY 
        WHERE email = ?
      `, [email]);
      
      if (rows.length === 0) {
        return { isLocked: false, attempts: 0 };
      }
      
      const security = rows[0];
      const now = new Date();
      
      // Check if account is locked
      if (security.locked_until && new Date(security.locked_until) > now) {
        const minutesLeft = Math.ceil((new Date(security.locked_until) - now) / (1000 * 60));
        return { 
          isLocked: true, 
          attempts: security.failed_attempts,
          lockedUntil: security.locked_until,
          minutesLeft: minutesLeft
        };
      }
      
      return { 
        isLocked: false, 
        attempts: security.failed_attempts || 0 
      };
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return { isLocked: false, attempts: 0 };
    }
  }
  
  static async recordFailedLogin(email) {
    try {
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_DURATION = 30; // 30 minuten
      
      // Upsert failed attempt
      await pool.query(`
        INSERT INTO LOGIN_SECURITY (email, failed_attempts, last_attempt) 
        VALUES (?, 1, NOW()) 
        ON DUPLICATE KEY UPDATE 
          failed_attempts = failed_attempts + 1,
          last_attempt = NOW(),
          locked_until = CASE 
            WHEN failed_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
            ELSE locked_until
          END
      `, [email, MAX_ATTEMPTS, LOCKOUT_DURATION]);
      
      return await this.checkAccountLockout(email);
    } catch (error) {
      console.error('Error recording failed login:', error);
      return { isLocked: false, attempts: 0 };
    }
  }
  
  static async recordSuccessfulLogin(email) {
    try {
      // Reset failed attempts on successful login
      await pool.query(`
        UPDATE LOGIN_SECURITY 
        SET failed_attempts = 0, locked_until = NULL, last_successful_login = NOW()
        WHERE email = ?
      `, [email]);
    } catch (error) {
      console.error('Error recording successful login:', error);
    }
  }
  
  static async logSecurityEvent(type, email, ip, userAgent, details = {}) {
    try {
      await pool.query(`
        INSERT INTO SECURITY_LOG (event_type, email, ip_address, user_agent, details, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [type, email, ip, userAgent, JSON.stringify(details)]);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Escape HTML and remove dangerous characters
    return validator.escape(str.trim());
  };
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  next();
};

// Password strength validation
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonPatterns: !/(123|abc|password|qwerty)/i.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const isStrong = score >= 4 && requirements.minLength;
  
  return {
    isValid: isStrong,
    score: score,
    requirements: requirements,
    message: isStrong ? 'Strong password' : 'Password does not meet security requirements'
  };
};

// Enhanced email validation
const validateEmail = (email) => {
  // Basic format check
  if (!validator.isEmail(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^\d+@/, // Starts with numbers
    /@\d+\./, // Domain starts with numbers
    /\+.*\+/, // Multiple + signs
    /\.{2,}/, // Multiple consecutive dots
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return { isValid: false, message: 'Suspicious email format' };
    }
  }
  
  // Check email length
  if (email.length > 254) {
    return { isValid: false, message: 'Email too long' };
  }
  
  return { isValid: true, message: 'Valid email' };
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3301", "http://localhost:8383"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
});

// Session timeout middleware
const sessionTimeout = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const jwt = require('jsonwebtoken');
    const config = require('../CONFIG/config');
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const now = Math.floor(Date.now() / 1000);
      const tokenAge = now - decoded.iat;
      const maxAge = 7 * 24 * 60 * 60; // 7 dagen in seconden
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          error: 'Session expired',
          message: 'Uw sessie is verlopen. Log opnieuw in.'
        });
      }
    } catch (error) {
      // Token is invalid, let other middleware handle it
    }
  }
  
  next();
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log sensitive operations
    const sensitiveRoutes = ['/login', '/register', '/change-password'];
    const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));
    
    if (isSensitive) {
      const logData = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        success: res.statusCode < 400
      };
      
      console.log('🔍 Security Audit:', JSON.stringify(logData));
      
      // Log to database for serious failures
      if (res.statusCode >= 400) {
        AccountSecurity.logSecurityEvent(
          'AUTH_FAILURE',
          req.body?.email || 'unknown',
          req.ip,
          req.get('User-Agent'),
          { path: req.path, statusCode: res.statusCode }
        );
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
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
};