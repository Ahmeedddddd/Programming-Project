//src/Server/MIDDLEWARE/auth.js

const jwt = require('jsonwebtoken');
const config = require('../CONFIG/config');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Geen toegangstoken opgegeven'
    });
  }
  
  // Handle test token for admin panel development
  if (token === 'test-admin-token-12345') {
    req.user = {
      userId: 'test-admin',
      userType: 'organisator',
      role: 'organisator',
      email: 'admin@test.com'
    };
    return next();
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired',
          message: 'Uw sessie is verlopen, log opnieuw in'
        });
      }
      
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token',
        message: 'Ongeldig toegangstoken'
      });
    }
    
    // Add user info to request object
    req.user = user;
    next();
  });
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        message: 'Authenticatie vereist'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.userType)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        message: 'Onvoldoende rechten voor deze actie',
        required: userRoles,
        current: req.user.userType
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is an organisator (admin)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required',
      message: 'Authenticatie vereist'
    });
  }
  
  if (req.user.userType !== 'organisator') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required',
      message: 'Administrator rechten vereist'
    });
  }
  
  next();
};

/**
 * Middleware to check if user can access their own resource or is admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required'
      });
    }
    
    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user.userId.toString() === resourceUserId.toString();
    const isAdmin = req.user.userType === 'organisator';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'U kunt alleen uw eigen gegevens bekijken'
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * Middleware to log authentication attempts
 */
const logAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  const hasToken = !!token;
  const userType = req.user?.userType || 'anonymous';
  
  console.log(`Auth: ${req.method} ${req.path} - User: ${userType}, Token: ${hasToken}`);
  next();
};

module.exports = { 
  authenticateToken, 
  requireRole, 
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
  logAuth
};