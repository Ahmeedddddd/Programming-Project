require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // async/await ondersteuning
const cors = require('cors'); // Voor cross-origin requests

const app = express();
const port = process.env.PORT || 3306;

// Middleware
app.use(cors());
app.use(express.json()); // JSON-body's verwerken
app.use(express.urlencoded({ extended: true })); // Formulieren verwerken

// Database configuratie
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mysql',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Maak een connection pool
const pool = mysql.createPool(dbConfig);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// Data ophalen - Student
app.get('/api/dataStudent', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Data ophalen - Bedrijf
app.get('/api/dataBedrijf', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Data ophalen - Project
app.get('/api/dataProject', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Data toevoegen
app.post('/api/data', async (req, res) => {
  const { column1, column2 } = req.body;

  if (!column1 || !column2) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO your_table_name (column1, column2) VALUES (?, ?)',
      [column1, column2]
    );
    res.status(201).json({ id: result.insertId, column1, column2 });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to insert data' });
  }
});

// Foutafhandeling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Server starten
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
