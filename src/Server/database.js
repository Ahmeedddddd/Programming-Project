require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Gebruik mysql2/promise voor async/await
const bodyParser = require('body-parser');
const cors = require('cors'); // Voor cross-origin requests

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database configuratie
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mysql', // Gebruik specifieke database naam uit .env of default 'mysql'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Maak een connection pool (beter voor performance)
const pool = mysql.createPool(dbConfig);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataStudent', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataBedrijf', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
      res.json(rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataProject', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
      res.json(rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

// Voorbeeld: POST endpoint om data toe te voegen
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});