const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const config = require('../CONFIG/config');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Zoek gebruiker in database (kan student, bedrijf of organisator zijn)
      const [users] = await pool.query(`
        SELECT 'student' as userType, studentnummer as id, email, NULL as password_hash
        FROM STUDENT WHERE email = ?
        UNION
        SELECT 'bedrijf' as userType, bedrijfsnummer as id, email, NULL as password_hash
        FROM BEDRIJF WHERE email = ?
        UNION
        SELECT 'organisator' as userType, organisatorId as id, email, lb.passwoord_hash
        FROM ORGANISATOR o
        LEFT JOIN LOGINBEHEER lb ON o.gebruikersId = lb.gebruikersId
        WHERE o.email = ?
      `, [email, email, email]);

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Voor organisatoren: check password
      if (user.userType === 'organisator' && user.password_hash) {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, userType: user.userType, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token,
        user: {
          id: user.id,
          type: user.userType,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  async register(req, res) {
    try {
      const { email, password, userType, ...userData } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user based on type
      let userId;
      if (userType === 'student') {
        userId = await Student.create({ email, ...userData });
      } else if (userType === 'bedrijf') {
        userId = await Bedrijf.create({ email, ...userData });
      }

      // Create login entry
      await pool.query(
        'INSERT INTO LOGINBEHEER (gebruikersId, passwoord_hash) VALUES (?, ?)',
        [userId, hashedPassword]
      );

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
};

module.exports = authController;