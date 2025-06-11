# Programming-Project

## 📋 Omschrijving

Dit project is ontwikkeld in het kader van het vak Programming Project. In een team van vijf studenten bouwen we een webapplicatie voor het evenement Career Launch, georganiseerd door onze hogeschool. De site richt zich op het verbeteren van de communicatie en organisatie tussen derdejaarsstudenten, bedrijven en organisatoren. We willen het makkelijker maken voor bedrijven en studenten elkaar te kunnen contacteren en het organiseren ervan versimpelen.

## 🌟 Kenmerken
* Responsieve navigatie met animaties
* Interactieve formulieren met validatie
* Facturatie systeem via e-mail
* Database-integratie voor studenten, bedrijven en projecten
* Pagina-specifieke scroll animaties
* Cross-platform compatibiliteit

## Gebruikte bronnen en tools
* Design: Figma (voor wireframes en ontwerp)
* Versiebeheer: Git & GitHub
* Samenwerking: Trello (voor taakverdeling en planning)
* Icons: svgrepo.com

## 🛠️ Technische Stack
### Frontend
* Vanilla JavaScript (ES6+)
* CSS3 met animaties en transitions
* HTML5 semantische structuur

### Backend
* Node.js met Express
* MySQL database
* Nodemailer voor e-mailfunctionaliteit
* Handlebars voor e-mailtemplates

## 📥 Installatie/gebruiksgids

### Vereisten
* Node.js (v16+)
* MySQL database
* Gmail account voor e-mailfunctionaliteit

### Packages installeren

`cd src/Server`
`npm install express nodemailer nodemailer-express-handlebars dotenv mysql2 body-parser cors`
`npm install --save-dev nodemon`

## Configuratie

* Maak een .env bestand in de root van het project met deze variabelen:
`EMAIL_USER=je@gmail.com`
`EMAIL_PASS=jeAppSpecifiekWachtwoord`
`DB_HOST=localhost`
`DB_USER=root`
`DB_PASSWORD=yourpassword`
`DB_NAME=careerlaunch`
* Importeer de database structuur naar MySQL

### Server starten

`cd src/Server`
`npm run dev`

* De applicatie is nu bereikbaar op: http://localhost:8383

## 🚀 Functies

### Frontend
* Dynamische menu's - Smooth animaties en responsive design
* Formulier verbeteringen - Ripple effects, loading states en validatie
* Scroll animaties - Elementen die in beeld komen met fade-in effecten
* Globale state management - Voor menu's en navigatie
* Factuur generatie - Dynamische facturen voor bedrijven

### Backend
* REST API - Endpoints voor studenten, bedrijven en projecten
* E-mail service - Facturen en bevestigingen versturen
* Database integratie - CRUD operaties voor alle entiteiten
* VIES API integratie - BTW-nummer validatie

## 📧 E-mailconfiguratie

De applicatie gebruikt Gmail voor het versturen van facturen. Zorg dat:

* Een geldig Gmail account is geconfigureerd in .env
* "Minder veilige apps" is ingeschakeld in Gmail instellingen
* De templates staan in src/Server/templates/

## 📚 API Documentatie

De backend biedt deze endpoints:

### Studenten
* GET /api/dataStudent - Haal studenten data op
* POST /api/student - Voeg nieuwe student toe

### Bedrijven
* GET /api/dataBedrijf - Haal bedrijfsdata op
* POST /api/bedrijf - Registreer nieuw bedrijf

### Facturen
* POST /api/send-invoice - Verstuur factuur naar bedrijf

## 🐛 Probleemoplossing
* Database connectie mislukt: Controleer .env variabelen en MySQL service
* E-mails worden niet verzonden: Verifieer Gmail instellingen en app-specifiek wachtwoord
* Menu werkt niet: Zorg dat startPage.js correct is geladen in je HTML
