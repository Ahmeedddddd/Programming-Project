# CareerLaunch EHB Platform

Dit project is een webapplicatie ontwikkeld voor het **Career Launch** evenement van de Erasmus Hogeschool Brussel. Het platform faciliteert de interactie en organisatie tussen studenten, bedrijven en de organisatoren van het evenement. Het hoofddoel is het stroomlijnen van de communicatie, het plannen van gesprekken en het presenteren van projecten en bedrijfsprofielen.

## ✨ Belangrijkste Functies

De applicatie ondersteunt drie gebruikerstypes, elk met specifieke functionaliteiten:

### 🎓 Studenten
- **Profielbeheer**: Studenten kunnen een account aanmaken, hun persoonlijke gegevens, projectdetails en contactinformatie beheren.
- **Bedrijven Ontdekken**: Een overzicht van alle deelnemende bedrijven, met zoek- en filtermogelijkheden.
- **Gesprekken Plannen**: Studenten kunnen tijdslots aanvragen voor gesprekken met bedrijven.
- **Mijn Gesprekken**: Een persoonlijk dashboard met de status van alle aangevraagde en bevestigde gesprekken.

### 🏢 Bedrijven
- **Profielbeheer**: Bedrijven kunnen hun profiel aanmaken en beheren, inclusief logo, beschrijving en contactgegevens.
- **Studenten Vinden**: Een lijst van alle deelnemende studenten, met filters op basis van studierichting, jaar en specialisatie.
- **Gesprekken Beheren**: Bedrijven kunnen gesprek aanvragen van studenten accepteren, weigeren of zelf initiëren.
- **Homepage Dashboard**: Een overzicht van aankomende gesprekken en interessante studentenprofielen.

### 🧑‍💼 Organisatoren
- **Admin Panel**: Een centraal dashboard voor het beheer van alle data: studenten, bedrijven, projecten en reserveringen.
- **Plattegrondbeheer**: Toewijzen van studenten (voormiddag) en bedrijven (namiddag) aan specifieke tafels op de plattegrond van het evenement.
- **Data Overzicht**: Statistieken en overzichten van alle activiteiten op het platform.

## 🛠️ Technische Architectuur

### Frontend
- **HTML5**: Semantische opmaak voor alle pagina's.
- **CSS3**: Styling met moderne features zoals Flexbox, Grid, en animaties voor een responsieve en dynamische user interface.
- **Vanilla JavaScript (ES6+)**: Client-side logica voor interactiviteit, API-communicatie en DOM-manipulatie.

### Backend
- **Node.js**: De runtime-omgeving voor de server.
- **Express.js**: Webapplicatie-framework voor het opzetten van de REST API en het beheren van routes.
- **MySQL**: Relationele database voor het opslaan van alle gegevens (studenten, bedrijven, afspraken, etc.).
- **Nodemailer**: Module voor het versturen van e-mails (bijv. welkomstmails, facturen).
- **Handlebars**: Template engine voor het dynamisch genereren van e-mail content.
- **JWT (JSON Web Tokens)**: Voor het beveiligen van de API-endpoints en het beheren van gebruikerssessies.

## 📂 Projectstructuur

Het project is opgedeeld in een duidelijke mappenstructuur om de scheiding tussen de frontend en backend te bewaren.

```
/
├── public/               # Statische bestanden (afbeeldingen, favicon)
├── src/
│   ├── CSS/              # Alle CSS-bestanden, georganiseerd per feature/pagina
│   ├── HTML/             # Alle HTML-pagina's, georganiseerd per feature
│   ├── JS/               # Frontend JavaScript, opgedeeld in modules en services
│   └── Server/           # De volledige Node.js backend
│       ├── CONFIG/         # Database- en serverconfiguratie
│       ├── CONTROLLERS/    # Logica voor het afhandelen van API-requests
│       ├── MIDDLEWARE/     # Express middleware (authenticatie, error handling)
│       ├── MODELS/         # Databasemodellen voor interactie met MySQL
│       ├── ROUTES/         # Definitie van alle API-endpoints
│       └── SERVICES/       # Externe services (e-mail, PDF, etc.)
└── README.md
```

## 🚀 Aan de slag

Volg deze stappen om het project lokaal op te zetten en te draaien.

### Vereisten
- [Node.js](https://nodejs.org/) (versie 16 of hoger aanbevolen)
- [MySQL](https://www.mysql.com/) database server

### Installatie
1.  **Clone de repository:**
    ```bash
    git clone https://github.com/Ahmeedddddd/Programming-Project.git
    cd Programming-Project
    ```

2.  **Installeer de backend dependencies:**
    ```bash
    cd src/Server
    npm run install:all
    ```

### Configuratie
1.  **Database opzetten:**
    - Zorg ervoor dat je MySQL-server draait.
    - Maak een nieuwe database aan, bijvoorbeeld `careerlaunch`.
    - Importeer de databasestructuur en eventuele startdata met het SQL-script dat in het project aanwezig is.

2.  **Omgevingsvariabelen (.env):**
    - Maak een `.env` bestand aan in de `src/Server/` map.
    - Kopieer de inhoud van `.env.example` (indien aanwezig) of gebruik de onderstaande template.
    - Vul de correcte waarden in voor je lokale omgeving.
    ```env
    # Database connectie
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=jouw_mysql_wachtwoord
    DB_NAME=careerlaunch

    # E-mail service (Gmail)
    EMAIL_USER=jouw_email@gmail.com
    EMAIL_PASS=je_app_specifieke_wachtwoord

    # JWT Secret
    JWT_SECRET=een_sterk_en_geheim_wachtwoord
    ```
    > **Let op:** Voor `EMAIL_PASS` moet je een "App-wachtwoord" genereren in je Google-accountinstellingen als je 2-factor authenticatie gebruikt.

### Server starten
1.  Navigeer naar de server map:
    ```bash
    cd src/Server
    ```
2.  Start de server in development modus (met automatische herstart bij wijzigingen):
    ```bash
    npm run dev
    ```
3.  De applicatie is nu toegankelijk op `http://localhost:8383`.

## 🐛 Probleemoplossing
- **Database connectie mislukt**: Controleer of je MySQL-server draait en of de gegevens in je `.env` bestand correct zijn.
- **E-mails worden niet verzonden**: Verifieer je Gmail-instellingen en zorg ervoor dat je een app-specifiek wachtwoord gebruikt.
- **Frontend laadt niet correct**: Open de developer console in je browser (F12) en controleer op foutmeldingen. Meestal heeft dit te maken met verkeerde paden naar CSS- of JS-bestanden.
