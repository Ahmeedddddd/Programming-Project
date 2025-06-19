// src/Server/MIDDLEWARE/auth.js

const jwt = require('jsonwebtoken');
const { pool } = require('../CONFIG/database');

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 * Enhanced to handle both Bearer tokens and cookies
 */

/**
 * Middleware to authenticate JWT token from Authorization header or cookies
 */
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 [auth] authenticateToken called for:', req.method, req.path);
    
    let token = null;
    
    // Method 1: Check Authorization header for Bearer token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔑 [auth] Token found in Authorization header');
    }
    
    // Method 2: Check cookies if no Bearer token found
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken' || name === 'token') {
          token = value;
          console.log('🍪 [auth] Token found in cookies:', name);
          break;
        }
      }
    }
    
    if (!token) {
      console.log('❌ [auth] No authentication token provided');
      return res.status(401).json({ 
        success: false,
        error: 'Access token required',
        message: 'Geen toegangstoken opgegeven'
      });
    }
    
    // Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ [auth] Token verified for user:', decoded.email || decoded.userId);
    } catch (jwtError) {
      console.error('❌ [auth] JWT verification error:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
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
    
    // Get fresh user data from database to ensure user still exists
    let userQuery, userParams;
    
    if (decoded.email) {
      userQuery = 'SELECT email, user_type as userType FROM users WHERE email = $1';
      userParams = [decoded.email];
    } else if (decoded.userId) {
      userQuery = 'SELECT email, user_type as userType FROM users WHERE id = $1';
      userParams = [decoded.userId];
    } else {
      console.log('❌ [auth] No email or userId in token');
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token format',
        message: 'Ongeldig token formaat'
      });
    }
    
    const userResult = await pool.query(userQuery, userParams);
    
    if (userResult.rows.length === 0) {
      console.log('❌ [auth] User not found in database:', decoded.email || decoded.userId);
      return res.status(401).json({ 
        success: false,
        error: 'User not found',
        message: 'Gebruiker niet gevonden'
      });
    }
    
    const userFromDb = userResult.rows[0];
    
    // Combine token data with fresh database data
    req.user = {
      email: userFromDb.email,
      userType: userFromDb.usertype,
      userId: decoded.userId || decoded.email,
      ...decoded // Include any additional token data
    };
    
    console.log('👤 [auth] User authenticated successfully:', req.user.email, '-', req.user.userType);
    next();
    
  } catch (error) {
    console.error('❌ [auth] Authentication error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      message: 'Authenticatie fout'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('🔒 [auth] requireRole check for:', roles);
    
    if (!req.user) {
      console.log('❌ [auth] No user in request object');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        message: 'Authenticatie vereist'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.userType)) {
      console.log('❌ [auth] Insufficient permissions. Required:', userRoles, 'Current:', req.user.userType);
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        message: 'Onvoldoende rechten voor deze actie',
        required: userRoles,
        current: req.user.userType
      });
    }
    
    console.log('✅ [auth] Role check passed for:', req.user.userType);
    next();
  };
};

/**
 * Middleware to check if user is an organisator (admin)
 */
const requireAdmin = (req, res, next) => {
  console.log('👑 [auth] requireAdmin check');
  
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required',
      message: 'Authenticatie vereist'
    });
  }
  
  if (req.user.userType !== 'organisator') {
    console.log('❌ [auth] Admin access denied for:', req.user.userType);
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required',
      message: 'Administrator rechten vereist'
    });
  }
  
  console.log('✅ [auth] Admin access granted');
  next();
};

/**
 * Middleware to check if user can access their own resource or is admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    console.log('🔐 [auth] requireOwnershipOrAdmin check');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required'
      });
    }
    
    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user.userId.toString() === resourceUserId.toString();
    const isAdmin = req.user.userType === 'organisator';
    
    console.log('🔍 [auth] Ownership check - Resource ID:', resourceUserId, 'User ID:', req.user.userId, 'Is Owner:', isOwner, 'Is Admin:', isAdmin);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'U kunt alleen uw eigen gegevens bekijken'
      });
    }
    
    console.log('✅ [auth] Ownership/Admin check passed');
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    console.log('🔓 [auth] optionalAuth called');
    
    let token = null;
    
    // Check Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check cookies if no Bearer token
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken' || name === 'token') {
          token = value;
          break;
        }
      }
    }
    
    if (!token) {
      console.log('ℹ️ [auth] No token provided for optional auth');
      req.user = null;
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database
      const userQuery = 'SELECT email, user_type as userType FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [decoded.email]);
      
      if (userResult.rows.length > 0) {
        const userFromDb = userResult.rows[0];
        req.user = {
          email: userFromDb.email,
          userType: userFromDb.usertype,
          userId: decoded.userId || decoded.email,
          ...decoded
        };
        console.log('✅ [auth] Optional auth successful for:', req.user.email);
      } else {
        req.user = null;
        console.log('⚠️ [auth] User not found for optional auth');
      }
    } catch (jwtError) {
      console.log('⚠️ [auth] Invalid token for optional auth:', jwtError.message);
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('❌ [auth] Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Middleware to log authentication attempts
 */
const logAuth = (req, res, next) => {
  const hasAuthHeader = !!req.headers['authorization'];
  const hasCookies = !!req.headers.cookie;
  const userType = req.user?.userType || 'anonymous';
  const userEmail = req.user?.email || 'none';
  
  console.log(`📊 [auth] ${req.method} ${req.path} - User: ${userType} (${userEmail}), Auth Header: ${hasAuthHeader}, Cookies: ${hasCookies}`);
  next();
};

/**
 * Debug middleware to inspect authentication state
 */
const debugAuth = (req, res, next) => {
  console.log('🐛 [auth] Debug Info:');
  console.log('  - Headers Authorization:', !!req.headers.authorization);
  console.log('  - Cookies:', req.headers.cookie ? 'Present' : 'None');
  console.log('  - User Object:', req.user ? {
    email: req.user.email,
    userType: req.user.userType,
    userId: req.user.userId
  } : 'None');
  next();
};

module.exports = { 
  authenticateToken, 
  requireRole, 
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
  logAuth,
  debugAuth
};