// src/Server/app.js
// Deze server is verantwoordelijk voor het bedienen van de frontend bestanden en de API endpoints

const express = require('express')
const app = express()
const port = 8383
const path = require('path');

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));

app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));
app.use('/src/JS', express.static(path.join(__dirname, '../JS')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/programma', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma.html'));
});

app.get('/programmaVoormidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-voormidag.html'));
});

app.get('/programmaNamidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-namidag.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/account-aanmaken.html'));
});

const { sendInvoice } = require('./mail'); // of pad naar juiste locatie
app.use(express.json()); // Zorg dat je JSON-body’s kunt ontvangen

app.post('/api/send-invoice', async (req, res) => {
  try {
    await sendInvoice(req.body);
    res.status(200).json({ message: '✅ Factuur verzonden!' });
  } catch (err) {
    console.error('❌ Fout bij verzenden:', err);
    res.status(500).json({ message: 'Verzenden mislukt' });
  }
});


app.listen(port, () => console.log(`Server has started on: http://localhost:${port}`))