const express = require('express');
const path = require('path');
const app = express();

// CSP header
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; font-src 'self';"
  );
  next();
});

// Serveer statische bestanden uit ../public
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hallo van de backend!' });
});

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});
