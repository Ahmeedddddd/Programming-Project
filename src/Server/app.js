const express = require('express')
const app = express()
const port = 8383
const path = require('path');


app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/programma', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma.html'));
});

app.listen(port, () => console.log(`Server has started on: http://localhost:${port}`))