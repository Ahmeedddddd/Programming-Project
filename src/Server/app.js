// src/Server/app.js
// Deze server is verantwoordelijk voor het bedienen van de frontend bestanden

const express = require('express')
const app = express()
const port = 8383
const path = require('path');

// Middleware voor JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));
app.use('/src/JS', express.static(path.join(__dirname, '../JS')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

//ACCOUNT
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/account-aanmaken.html'));
});

//BEDRIJVEN
app.get('/accountBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/account-bedrijf.html'));
});

app.get('/gegevensBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/gegevens-bedrijf.html'));
});
app.get('/tarieven', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJF/tarieven.html'));
});

//INFO
app.get('/info', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info.html'));
});

app.get('/infoStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info-student.html'));
});

app.get('/infoBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info-bedrijven.html'));
});

app.get('/infoCareerLaunch', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info-career-launch.html'));
});

app.get('/contacteer', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/contacteer.html'));
});
app.get('/tarieven-info', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/tarieven-info.html'));
});


//ORGANISATOR
app.get('/accountOrganisator', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/account-organisator.html'));
});

app.get('/gegevensOrganisator', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/gegevens-organisator.html'));
});

app.get('/overzichtOrganisator', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/overzicht-organisator.html'));
});

app.get('/adminPanel', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/admin-panel.html'));
});

//PROGRAMMA
app.get('/programma', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma.html'));
});

app.get('/programmaVoormidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-voormidag.html'));
});

app.get('/programmaNamidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-namidag.html'));
});

//RESULTS
  //BEDRIJVEN
app.get('/alleBedrijven', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html'));
});

app.get('/resultaatBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/BEDRIJVEN/resultaat-bedrijf.html'));
});

  //PROJECTEN
app.get('/alleProjecten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/PROJECTEN/alle-projecten.html'));
});

app.get('/zoekbalkProjecten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/PROJECTEN/zoekbalk-projecten.html'));
});

  //RESERVATIES
app.get('/reservatie', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/RESERVATIES/reservatie.html'));
});

app.get('/gesprekkenOverzicht', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/RESERVATIES/gesprekken-overzicht.html'));
});

  //STUDENTEN
app.get('/alleStudenten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html'));
});

app.get('/zoekbalkStudenten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/zoekbalk-studenten.html'));
});

//STUDENTEN
app.get('/accountStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENT/account-student.html'));
});

app.get('/gegevensStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENT/gegevens-student.html'));
});

app.get('/mijnProject', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENT/mijn-project.html'));
});

// Email service endpoint - Check if SERVICES folder exists
app.post('/api/send-invoice', async (req, res) => {
  try {
    // Try to load email service if it exists
    const { sendInvoice } = require('./SERVICES/emailServ');
    await sendInvoice(req.body);
    res.status(200).json({ message: '✅ Factuur verzonden!' });
  } catch (err) {
    console.error('❌ Email service niet gevonden of fout bij verzenden:', err);
    // Return success for now, but log the error
    res.status(200).json({ message: '📝 Factuur aangemaakt (email service niet actief)' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`🎓 CareerLaunch Frontend Server running on: http://localhost:${port}`);
  console.log(`📱 Available pages:`);
  console.log(`   - Home: http://localhost:${port}/`);
  console.log(`   - Login: http://localhost:${port}/login`);
  console.log(`   - Admin Panel: http://localhost:${port}/adminPanel`);
  console.log(`   - All Students: http://localhost:${port}/alleStudenten`);
  console.log(`   - All Companies: http://localhost:${port}/alleBedrijven`);
});