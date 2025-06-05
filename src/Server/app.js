const express = require('express');
const path = require('path');
const app = express();



// API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hallo van de backend!' });
});

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});
