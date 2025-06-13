const jwt = require('jsonwebtoken');
const config = require('../CONFIG/config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // ✅ DEVELOPMENT: Accept test token (ALLEEN DEZE 8 REGELS TOEGEVOEGD)
  if (token === 'test-admin-token-12345') {
    req.user = {
      userId: 'test-admin',
      userType: 'organisator'
    };
    return next();
  }
  // ✅ EINDE TOEVOEGING

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };