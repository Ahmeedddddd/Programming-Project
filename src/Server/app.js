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

app.listen(port, () => console.log(`Server has started on: http://localhost:${port}`))