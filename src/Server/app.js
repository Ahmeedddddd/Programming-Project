// src/Server/app.js
// =================

const express = require("express");
const app = express();
const port = 8383;
const path = require("path");
const cors = require("cors");

console.log("🚀 Starting CareerLaunch Server...");

// ===== MIDDLEWARE IMPORTS =====
const {
  serveRoleBasedHomepage,
  getUserInfo,
  requireAuth,
  getLiveStats,
  requireRole,
  generateClientSideScript,
} = require("./MIDDLEWARE/rolCheck");

// ===== ROUTE IMPORTS (organized) =====
let registratieRoutes,
    authRoutes,
    bedrijfRoutes,
    reservatiesRoutes,
    studentRoutes,
    organisatorRoutes,
    projectRoutes;

try {
  registratieRoutes    = require("./ROUTES/registratie");
  authRoutes           = require("./ROUTES/auth");
  bedrijfRoutes        = require("./ROUTES/bedrijf");
  reservatiesRoutes    = require("./ROUTES/reservaties");
  studentRoutes        = require("./ROUTES/student");
  organisatorRoutes    = require("./ROUTES/organisator");
  projectRoutes        = require("./ROUTES/project");
  console.log("✅ All route modules loaded successfully");
} catch (error) {
  console.error("❌ Error loading route modules:", error.message);
  process.exit(1);
}

// ===== EXPRESS CONFIGURATION =====
app.use(cors({
  origin: ["http://localhost:8383", "http://localhost:3301"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== REQUEST LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}${req.query && Object.keys(req.query).length ? '?' + Object.keys(req.query).map(k => `${k}=${req.query[k]}`).join('&') : ''}`);
  next();
});

// ===== STATIC FILE SERVING =====
app.use(express.static(path.join(__dirname, "../CareerLaunch")));
app.use(express.static(path.join(__dirname, "../../public")));
app.use("/src/CSS", express.static(path.join(__dirname, "../CSS")));
app.use("/src/JS", express.static(path.join(__dirname, "../JS")));
app.use("/images", express.static(path.join(__dirname, "../../public/images")));

// ===== DYNAMIC SCRIPTS =====
app.get("/js/role-manager.js", async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const script = await generateClientSideScript();
    res.send(script);
  } catch (error) {
    console.error("❌ Error generating role manager script:", error);
    res.status(500).send("console.error('Failed to load role manager');");
  }
});

app.get("/js/navigation-manager.js", async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const script = await generateClientSideScript();
    res.send(script);
  } catch (error) {
    console.error("❌ Error generating navigation manager script:", error);
    res.status(500).send("console.error('Failed to load navigation manager');");
  }
});

// ===== API ROUTES (MOUNTED FIRST - CRITICAL) =====
console.log("🔗 Mounting API routes...");

app.get("/api/user-info", getUserInfo);
app.get("/api/stats/live", getLiveStats);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const { pool } = require("./CONFIG/database");
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.4.1",
      database: "connected",
      port: port,
      features: {
        roleBasedRouting: "Enabled",
        legacyCompatibility: "Enabled",
        authenticationRequired: "Enabled",
        apiRoutesFixed: "Enabled",
        parameterPreservingRedirects: "Enabled",
        contactpersonenAPI: "Added"
      }
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      port: port
    });
  }
});

// Mount API routes
try {
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes mounted");
  app.use("/api/registratie", registratieRoutes);
  console.log("✅ Registration routes mounted");
  app.use("/api/bedrijven", bedrijfRoutes);
  console.log("✅ Bedrijf routes mounted");
  app.use("/api/studenten", studentRoutes);
  console.log("✅ Student routes mounted");
  app.use("/api/reservaties", reservatiesRoutes);
  console.log("✅ Reservatie routes mounted");
  app.use("/api/organisator", organisatorRoutes);
  console.log("✅ Organisator routes mounted");
  app.use("/api/projecten", projectRoutes);
  console.log("✅ Project routes mounted");
} catch (error) {
  console.error("❌ Failed to mount one or more API routes:", error);
}

// ===== EMAIL SERVICE ENDPOINT =====
app.post("/api/send-invoice", async (req, res) => {
  try {
    const { sendInvoice } = require("./SERVICES/emailServ");
    await sendInvoice(req.body);
    res.status(200).json({ message: "✅ Factuur verzonden!" });
  } catch (err) {
    console.error("❌ Email service niet gevonden:", err.message);
    res.status(200).json({
      message: "📝 Factuur aangemaakt (email service niet actief)"
    });
  }
});

// ===== PAGE ROUTES =====
// Homepage
app.get("/", serveRoleBasedHomepage);
app.get("/index.html", serveRoleBasedHomepage);

// Role-based homepages
app.get("/student-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/student-homepage.html"));
});
app.get("/bedrijf-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/homepage-bedrijf.html"));
});
app.get("/organisator-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/organisator-homepage.html"));
});

// Account routes (protected)
app.get("/account-student", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/account-student.html"));
});
app.get("/gegevens-student", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/gegevens-student.html"));
});
app.get("/mijn-project", requireRole(["student"]), (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/mijn-project.html"));
});

app.get("/account-bedrijf", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/account-bedrijf.html"));
});
app.get("/gegevens-bedrijf", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/gegevens-bedrijf.html"));
});

app.get("/account-organisator", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/account-organisator.html"));
});
app.get("/gegevens-organisator", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/gegevens-organisator.html"));
});
app.get("/admin-panel", requireRole(["organisator"]), (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/admin-panel.html"));
});
app.get("/overzicht-organisator", requireRole(["organisator"]), (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/overzicht-organisator.html"));
});

// Authentication routes
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/account-aanmaken.html"));
});
app.get("/change-password", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/change-password.html"));
});

// Conversation routes
app.get("/gesprekken-overzicht", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-studenten.html"));
});
app.get("/gesprekken-overzicht-bedrijven", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-bedrijven.html"));
});
app.get("/gesprekken-overzicht-studenten", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-studenten.html"));
});

// Program routes
app.get("/programma", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/PROGRAMMA/programma.html"));
});
app.get("/programma-bedrijven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/programma-bedrijven.html"));
});
app.get("/programma-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/programma-studenten.html"));
});

// Company routes
app.get("/alle-bedrijven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html"));
});
app.get("/resultaat-bedrijf", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/BEDRIJVEN/resultaat-bedrijf.html"));
});
app.get("/tarieven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/tarieven.html"));
});

// Student routes
app.get("/alle-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html"));
});
app.get("/zoekbalk-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/STUDENTEN/zoekbalk-studenten.html"));
});

// Project routes
app.get("/alle-projecten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/PROJECTEN/alle-projecten.html"));
});
app.get("/zoekbalk-projecten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/PROJECTEN/zoekbalk-projecten.html"));
});

// Reservation routes
app.get("/reservatie", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/RESERVATIES/reservatie.html"));
});

// Info routes
app.get("/info", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/info.html"));
});
app.get("/info-student", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/informatie-studenten.html"));
});
app.get("/info-bedrijf", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/informatie-bedrijven.html"));
});
app.get("/info-career-launch", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/informatie-career-launch.html"));
});
app.get("/contacteer", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/contacteer.html"));
});
app.get("/tarieven-info", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/tarieven-info.html"));
});

// Legacy routes with parameter-preserving redirects
function redirectWithParams(oldPath, newPath) {
  return (req, res) => {
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString() 
      : '';
    res.redirect(newPath + queryString);
  };
}

app.get("/accountStudent", requireAuth, redirectWithParams("/accountStudent", "/account-student"));
app.get("/gegevensStudent", requireAuth, redirectWithParams("/gegevensStudent", "/gegevens-student"));
app.get("/mijnProject", requireRole(["student"]), redirectWithParams("/mijnProject", "/mijn-project"));
app.get("/accountBedrijf", requireAuth, redirectWithParams("/accountBedrijf", "/account-bedrijf"));
app.get("/gegevensBedrijf", requireAuth, redirectWithParams("/gegevensBedrijf", "/gegevens-bedrijf"));
app.get("/accountOrganisator", requireAuth, redirectWithParams("/accountOrganisator", "/account-organisator"));
app.get("/gegevensOrganisator", requireAuth, redirectWithParams("/gegevensOrganisator", "/gegevens-organisator"));
app.get("/adminPanel", requireRole(["organisator"]), redirectWithParams("/adminPanel", "/admin-panel"));
app.get("/overzichtOrganisator", requireRole(["organisator"]), redirectWithParams("/overzichtOrganisator", "/overzicht-organisator"));

app.get("/gesprekkenOverzicht", requireAuth, redirectWithParams("/gesprekkenOverzicht", "/gesprekken-overzicht"));
app.get("/gesprekkenOverzichtBedrijven", requireAuth, redirectWithParams("/gesprekkenOverzichtBedrijven", "/gesprekken-overzicht-bedrijven"));
app.get("/gesprekkenOverzichtStudenten", requireAuth, redirectWithParams("/gesprekkenOverzichtStudenten", "/gesprekken-overzicht-studenten"));

app.get("/programmaBedrijven", redirectWithParams("/programmaBedrijven", "/programma-bedrijven"));
app.get("/programmaStudenten", redirectWithParams("/programmaStudenten", "/programma-studenten"));

app.get("/alleBedrijven", redirectWithParams("/alleBedrijven", "/alle-bedrijven"));
app.get("/resultaatBedrijf", redirectWithParams("/resultaatBedrijf", "/resultaat-bedrijf"));

app.get("/alleStudenten", redirectWithParams("/alleStudenten", "/alle-studenten"));
app.get("/zoekbalkStudenten", redirectWithParams("/zoekbalkStudenten", "/zoekbalk-studenten"));

app.get("/alleProjecten", redirectWithParams("/alleProjecten", "/alle-projecten"));
app.get("/zoekbalkProjecten", redirectWithParams("/zoekbalkProjecten", "/zoekbalk-projecten"));

app.get("/infoStudent", redirectWithParams("/infoStudent", "/info-student"));
app.get("/infoBedrijf", redirectWithParams("/infoBedrijf", "/info-bedrijf"));
app.get("/infoCareerLaunch", redirectWithParams("/infoCareerLaunch", "/info-career-launch"));

// Test and favicon
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/test.html"));
});
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/favicon.ico"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
  res.status(500).send(`
    <h1>Server Error</h1>
    <p>Er ging iets mis. Probeer later opnieuw.</p>
    <a href="/">Terug naar homepage</a>
  `);
});

// 404 handler
app.use((req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.path}`);
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "API endpoint not found",
      path: req.path,
      method: req.method
    });
  }
  if (req.path === "/account") {
    return res.redirect("/login");
  }
  res.redirect("/");
});

// ===== SERVER STARTUP =====
app.listen(port, () => {
  console.log(`🎓 CareerLaunch Server running on http://localhost:${port}`);
});
