//src/Server/ROUTES/auth.js

// API routes voor authenticatie met veilige wachtwoord handling
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { 
  authenticateUser, 
  createUserCredentials, 
  updatePassword,
  validatePasswordStrength 
} = require('../PASSWOORD/CONFIG/passwordhasher.js');

const router = express.Router();

// LOGIN ENDPOINT
/**
 * POST /api/auth/login
 * Gebruiker inloggen
 * Body: { userType, identifier, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { userType, identifier, password } = req.body;
    
    // Input validatie
    if (!userType || !identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Alle velden zijn verplicht',
        fields: ['userType', 'identifier', 'password']
      });
    }
    
    // Valideer userType
    const validUserTypes = ['organisator', 'bedrijf', 'student'];
    if (!validUserTypes.includes(userType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Ongeldig gebruikerstype',
        validTypes: validUserTypes
      });
    }
    
    // Authenticeer gebruiker
    const authResult = await authenticateUser(userType, identifier, password);
    
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }
    
    // Genereer JWT token
    const tokenPayload = {
      gebruikersId: authResult.user.gebruikersId,
      userType: authResult.userType,
      identifier: identifier
    };
    
    // Voeg specifieke user data toe aan payload
    switch(authResult.userType) {
      case 'organisator':
        tokenPayload.organisatorId = authResult.user.organisatorId;
        break;
      case 'bedrijf':
        tokenPayload.bedrijfsnummer = authResult.user.bedrijfsnummer;
        break;
      case 'student':
        tokenPayload.studentnummer = authResult.user.studentnummer;
        break;
    }
    
    const token = jwt.sign(tokenPayload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn 
    });
    
    // Succesvol login
    res.json({
      success: true,
      message: 'Login succesvol',
      token: token,
      user: {
        id: authResult.user.gebruikersId,
        type: authResult.userType,
        ...authResult.user
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een serverfout opgetreden'
    });
  }
});


// REGISTRATIE ENDPOINT
/**
 * POST /api/auth/register
 * Nieuwe gebruiker registreren (alleen voor admins)
 * Body: { userType, identifier, password, confirmPassword }
 */
router.post('/register', authenticateAdmin, async (req, res) => {
  try {
    const { userType, identifier, password, confirmPassword } = req.body;
    
    // Input validatie
    if (!userType || !identifier || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Alle velden zijn verplicht'
      });
    }
    
    // Wachtwoord bevestiging
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Wachtwoorden komen niet overeen'
      });
    }
    
    // Valideer wachtwoord sterkte
    const strengthValidation = validatePasswordStrength(password);
    if (!strengthValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Wachtwoord voldoet niet aan de vereisten',
        requirements: strengthValidation.requirements,
        score: strengthValidation.score
      });
    }
    
    // Maak gebruiker credentials aan
    const result = await createUserCredentials(userType, identifier, password);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een serverfout opgetreden'
    });
  }
});


// WACHTWOORD WIJZIGEN
/**
 * PUT /api/auth/change-password
 * Wachtwoord wijzigen voor ingelogde gebruiker
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const { userType, identifier } = req.user;
    
    // Input validatie
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Alle velden zijn verplicht'
      });
    }
    
    // Wachtwoord bevestiging
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nieuwe wachtwoorden komen niet overeen'
      });
    }
    
    // Valideer wachtwoord sterkte
    const strengthValidation = validatePasswordStrength(newPassword);
    if (!strengthValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Nieuw wachtwoord voldoet niet aan de vereisten',
        requirements: strengthValidation.requirements
      });
    }
    
    // Update wachtwoord
    const result = await updatePassword(userType, identifier, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een serverfout opgetreden'
    });
  }
});


// WACHTWOORD RESET (voor admins)
/**
 * PUT /api/auth/reset-password
 * Wachtwoord resetten voor gebruiker (alleen admins)
 * Body: { userType, identifier, newPassword }
 */
router.put('/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const { userType, identifier, newPassword } = req.body;
    
    // Input validatie
    if (!userType || !identifier || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Alle velden zijn verplicht'
      });
    }
    
    // Valideer wachtwoord sterkte
    const strengthValidation = validatePasswordStrength(newPassword);
    if (!strengthValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Wachtwoord voldoet niet aan de vereisten',
        requirements: strengthValidation.requirements
      });
    }
    
    // Voor reset gebruiken we createUserCredentials (overschrijft bestaande)
    // Of we maken een speciale resetPassword functie
    const result = await createUserCredentials(userType, identifier, newPassword);
    
    res.json({
      success: true,
      message: 'Wachtwoord succesvol gereset'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een serverfout opgetreden'
    });
  }
});


// TOKEN VERIFICATIE
/**
 * GET /api/auth/verify
 * Verifieer JWT token en haal user data op
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is geldig',
    user: req.user
  });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, (req, res) => {
  const newToken = jwt.sign(
    { 
      gebruikersId: req.user.gebruikersId,
      userType: req.user.userType,
      identifier: req.user.identifier
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  res.json({
    success: true,
    message: 'Token vernieuwd',
    token: newToken
  });
});


// MIDDLEWARE FUNCTIES
/**
 * Middleware om JWT token te verifiëren
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Toegang geweigerd. Geen token opgegeven.'
    });
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Ongeldig token'
      });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Middleware om te controleren of gebruiker een admin is
 */
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) return;
    
    if (req.user.userType !== 'organisator') {
      return res.status(403).json({
        success: false,
        message: 'Toegang geweigerd. Admin rechten vereist.'
      });
    }
    
    next();
  });
}

/**
 * Middleware om te controleren of gebruiker toegang heeft tot resource
 */
function authorizeUser(allowedUserTypes = []) {
  return (req, res, next) => {
    authenticateToken(req, res, (err) => {
      if (err) return;
      
      if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(req.user.userType)) {
        return res.status(403).json({
          success: false,
          message: 'Toegang geweigerd. Onvoldoende rechten.',
          allowedUserTypes: allowedUserTypes
        });
      }
      
      next();
    });
  };
}


// WACHTWOORD VALIDATIE ENDPOINT
/**
 * POST /api/auth/validate-password
 * Valideer wachtwoord sterkte zonder op te slaan
 */
router.post('/validate-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Wachtwoord is verplicht'
    });
  }
  
  const validation = validatePasswordStrength(password);
  
  res.json({
    success: true,
    validation: validation
  });
});

// Export middleware voor gebruik in andere routes
module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.authenticateAdmin = authenticateAdmin;
module.exports.authorizeUser = authorizeUser;