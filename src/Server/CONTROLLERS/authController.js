// src/Server/CONTROLLERS/authController.js

const Auth = require('../MODELS/auth');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../CONFIG/database');
const config = require('../CONFIG/config');
const bcrypt = require('bcrypt');

const authController = {

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // 🔐 LOGIN - FIXED EMAIL-BASED VERSION
async login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
  // 🔐 LOGIN - BESTAANDE FUNCTIE (ongewijzigd)
=======
  // 🔐 EMAIL-FIRST LOGIN
>>>>>>> Stashed changes
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
<<<<<<< Updated upstream
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
>>>>>>> Stashed changes
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
<<<<<<< Updated upstream

    const { email, password } = req.body;

    console.log(`🔐 Login attempt for email: ${email}`);

    // ✅ Email naar identifier mapping functie
    async function emailToIdentifier(email) {
      try {
        // Check in STUDENT table
        const [students] = await pool.query(
          'SELECT studentnummer, email FROM STUDENT WHERE email = ?',
          [email]
        );
        if (students.length > 0) {
          console.log(`📚 Found student: ${students[0].studentnummer}`);
          return { userType: 'student', identifier: students[0].studentnummer };
        }

        // Check in BEDRIJF table  
        const [bedrijven] = await pool.query(
          'SELECT bedrijfsnummer, email FROM BEDRIJF WHERE email = ?',
          [email]
        );
        if (bedrijven.length > 0) {
          console.log(`🏢 Found bedrijf: ${bedrijven[0].bedrijfsnummer}`);
          return { userType: 'bedrijf', identifier: bedrijven[0].bedrijfsnummer };
        }

        // Check in ORGANISATOR table
        const [organisators] = await pool.query(
          'SELECT email FROM ORGANISATOR WHERE email = ?',
          [email]
        );
        if (organisators.length > 0) {
          console.log(`👔 Found organisator: ${email}`);
          return { userType: 'organisator', identifier: email };
        }

        return null;
      } catch (error) {
        console.error('Error in emailToIdentifier:', error);
        return null;
      }
    }

    // ✅ Zoek user type en identifier op basis van email
    const userLookup = await emailToIdentifier(email);
    if (!userLookup) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        message: 'Geen account gevonden met dit email adres'
      });
    }

    console.log(`🎯 Authenticating ${userLookup.userType} with identifier: ${userLookup.identifier}`);

    // ✅ Gebruik bestaande authenticateUser functie met correcte identifier
    const authResult = await authenticateUser(userLookup.userType, userLookup.identifier, password);
    
    if (!authResult.success) {
      console.log(`❌ Authentication failed: ${authResult.message}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        message: 'Email of wachtwoord is onjuist'
      });
    }

    console.log(`✅ Authentication successful for ${authResult.user.email || email}`);

    // Generate JWT token met juiste payload
    const tokenPayload = {
      gebruikersId: authResult.user.gebruikersId,
      userId: userLookup.identifier,
      userType: userLookup.userType,
      email: email
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn 
    });

    // ✅ Consistent response format
    res.json({
      success: true,
      message: 'Login succesvol',
      token: token,
      user: {
        userId: userLookup.identifier,
        userType: userLookup.userType,
        email: email,
        ...authResult.user  // Include additional user data
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
=======
  },
=======
      }
>>>>>>> Stashed changes

      const { email, password } = req.body;
      console.log(`🔐 Login attempt for email: ${email}`);

      // 🎯 SINGLE EMAIL-TO-USER LOOKUP FUNCTION
      const userResult = await this.findUserByEmailAndValidatePassword(email, password);
      
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
=======
      }

<<<<<<< Updated upstream
=======
      const { email, password } = req.body;
      console.log(`🔐 Login attempt for email: ${email}`);

      // 🎯 SINGLE EMAIL-TO-USER LOOKUP FUNCTION
      const userResult = await this.findUserByEmailAndValidatePassword(email, password);
      
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

>>>>>>> Stashed changes
  // 🔍 MAIN EMAIL-TO-USER LOOKUP WITH PASSWORD VALIDATION
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
>>>>>>> Stashed changes

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

  // Rest of the methods remain the same...
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

      // Check if email already exists
      const existingUser = await this.checkEmailExists(studentData.email);
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

      // Check if email already exists
      const existingUser = await this.checkEmailExists(bedrijfData.email);
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

      // Get fresh user data from database
      const userResult = await this.getUserDataByEmail(email, userType);
      
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