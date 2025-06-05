// Server/app.js
const express = require('express');
const path = require('path');
const app = express();

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));

<<<<<<< Updated upstream
// Voorbeeld API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hallo van de backend!' });
=======
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));
app.use('/src/JS', express.static(path.join(__dirname, '../JS')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
>>>>>>> Stashed changes
});

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});

console.log("test")