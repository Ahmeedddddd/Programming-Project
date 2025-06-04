// Server/app.js
const express = require('express');
const path = require('path');
const app = express();

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));

// Voorbeeld API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hallo van de backend!' });
});

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});

console.log("test")