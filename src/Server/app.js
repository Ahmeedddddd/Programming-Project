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
const registratieRoutes = require("./ROUTES/registratie");
const authRoutes = require("./ROUTES/auth");
const bedrijfRoutes = require("./ROUTES/bedrijf");
const reservatiesRoutes = require("./ROUTES/reservaties");
const studentRoutes = require("./ROUTES/student");
const organisatorRoutes = require("./ROUTES/organisator");

// ===== EXPRESS CONFIGURATION =====
app.use(cors({
  origin: ["http://localhost:8383", "http://localhost:3301"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  res.setHeader("Content-Type", "application/javascript");
  const script = await generateClientSideScript();
  res.send(script);
});

// ===== HOMEPAGE ROUTING =====
app.get("/", serveRoleBasedHomepage);
app.get("/index.html", serveRoleBasedHomepage);

// ===== ROLE-BASED HOMEPAGES =====
app.get("/student-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/student-homepage.html"));
});

app.get("/bedrijf-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/homepage-bedrijf.html"));
});

app.get("/organisator-homepage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/organisator-homepage.html"));
});

// ===== ACCOUNT ROUTES (PROTECTED) =====
// Student Account Routes
app.get("/account-student", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/account-student.html"));
});

app.get("/gegevens-student", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/gegevens-student.html"));
});

app.get("/mijn-project", requireRole(["student"]), (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/mijn-project.html"));
});

// Bedrijf Account Routes
app.get("/account-bedrijf", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/account-bedrijf.html"));
});

app.get("/gegevens-bedrijf", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/gegevens-bedrijf.html"));
});

// Organisator Account Routes  
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

// ===== LEGACY ACCOUNT ROUTES (for compatibility) =====
app.get("/accountStudent", requireAuth, (req, res) => {
  res.redirect("/account-student");
});

app.get("/gegevensStudent", requireAuth, (req, res) => {
  res.redirect("/gegevens-student");
});

app.get("/mijnProject", requireRole(["student"]), (req, res) => {
  res.redirect("/mijn-project");
});

app.get("/accountBedrijf", requireAuth, (req, res) => {
  res.redirect("/account-bedrijf");
});

app.get("/gegevensBedrijf", requireAuth, (req, res) => {
  res.redirect("/gegevens-bedrijf");
});

app.get("/accountOrganisator", requireAuth, (req, res) => {
  res.redirect("/account-organisator");
});

app.get("/gegevensOrganisator", requireAuth, (req, res) => {
  res.redirect("/gegevens-organisator");
});

app.get("/adminPanel", requireRole(["organisator"]), (req, res) => {
  res.redirect("/admin-panel");
});

app.get("/overzichtOrganisator", requireRole(["organisator"]), (req, res) => {
  res.redirect("/overzicht-organisator");
});

// ===== AUTHENTICATION ROUTES =====
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/account-aanmaken.html"));
});

app.get("/change-password", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/change-password.html"));
});

// ===== CONVERSATION ROUTES =====
app.get("/gesprekken-overzicht", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-studenten.html"));
});

app.get("/gesprekken-overzicht-bedrijven", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-bedrijven.html"));
});

app.get("/gesprekken-overzicht-studenten", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/GESPREKKEN/gesprekken-overzicht-studenten.html"));
});

// Legacy routes
app.get("/gesprekkenOverzicht", requireAuth, (req, res) => {
  res.redirect("/gesprekken-overzicht");
});

app.get("/gesprekkenOverzichtBedrijven", requireAuth, (req, res) => {
  res.redirect("/gesprekken-overzicht-bedrijven");
});

app.get("/gesprekkenOverzichtStudenten", requireAuth, (req, res) => {
  res.redirect("/gesprekken-overzicht-studenten");
});

// ===== PROGRAM ROUTES =====
app.get("/programma", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/PROGRAMMA/programma.html"));
});

app.get("/programma-bedrijven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/programma-bedrijven.html"));
});

app.get("/programma-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/programma-studenten.html"));
});

// Legacy routes
app.get("/programmaBedrijven", (req, res) => {
  res.redirect("/programma-bedrijven");
});

app.get("/programmaStudenten", (req, res) => {
  res.redirect("/programma-studenten");
});

// ===== COMPANY ROUTES =====
app.get("/alle-bedrijven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html"));
});

app.get("/resultaat-bedrijf", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/BEDRIJVEN/resultaat-bedrijf.html"));
});

app.get("/tarieven", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/tarieven.html"));
});

// Legacy routes
app.get("/alleBedrijven", (req, res) => {
  res.redirect("/alle-bedrijven");
});

app.get("/resultaatBedrijf", (req, res) => {
  res.redirect("/resultaat-bedrijf");
});

// ===== STUDENT ROUTES =====
app.get("/alle-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html"));
});

app.get("/zoekbalk-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/STUDENTEN/zoekbalk-studenten.html"));
});

// Legacy routes
app.get("/alleStudenten", (req, res) => {
  res.redirect("/alle-studenten");
});

app.get("/zoekbalkStudenten", (req, res) => {
  res.redirect("/zoekbalk-studenten");
});

// ===== PROJECT ROUTES =====
app.get("/alle-projecten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/PROJECTEN/alle-projecten.html"));
});

app.get("/zoekbalk-projecten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/PROJECTEN/zoekbalk-projecten.html"));
});

// Legacy routes
app.get("/alleProjecten", (req, res) => {
  res.redirect("/alle-projecten");
});

app.get("/zoekbalkProjecten", (req, res) => {
  res.redirect("/zoekbalk-projecten");
});

// ===== RESERVATION ROUTES =====
app.get("/reservatie", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/RESULTS/RESERVATIES/reservatie.html"));
});

// ===== INFO ROUTES =====
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

// Legacy routes
app.get("/infoStudent", (req, res) => {
  res.redirect("/info-student");
});

app.get("/infoBedrijf", (req, res) => {
  res.redirect("/info-bedrijf");
});

app.get("/infoCareerLaunch", (req, res) => {
  res.redirect("/info-career-launch");
});

// ===== API ROUTES =====
app.get("/api/user-info", getUserInfo);
app.get("/api/stats/live", getLiveStats);

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/registratie", registratieRoutes);
app.use("/api/bedrijven", bedrijfRoutes);
app.use("/api/studenten", studentRoutes);
app.use("/api/reservaties", reservatiesRoutes);
app.use("/api/organisator", organisatorRoutes);

// Email service endpoint
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

// ===== HEALTH CHECK =====
app.get("/api/health", async (req, res) => {
  try {
    const { pool } = require("./CONFIG/database");
    await pool.query("SELECT 1");
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.2.0",
      database: "connected",
      features: {
        roleBasedRouting: "Enabled",
        legacyCompatibility: "Enabled",
        authenticationRequired: "Enabled"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ===== TEST ROUTES =====
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/test.html"));
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/favicon.ico"));
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
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

  // Redirect account to login for unauthenticated users
  if (req.path === "/account") {
    return res.redirect("/login");
  }

  // Redirect to homepage for other 404s
  res.redirect("/");
});

// ===== SERVER STARTUP =====
app.listen(port, () => {
  console.log("🎓 CareerLaunch Server running on: http://localhost:" + port);
  console.log("📋 Features Enabled:");
  console.log("   ✅ Role-based homepage routing");
  console.log("   ✅ Protected account routes");
  console.log("   ✅ Legacy route compatibility");
  console.log("   ✅ Organized URL structure");
  console.log("   ✅ Enhanced authentication");
  console.log("🔗 Key Endpoints:");
  console.log("   - Health: http://localhost:" + port + "/api/health");
  console.log("   - User Info: http://localhost:" + port + "/api/user-info");
  console.log("   - Role Manager: http://localhost:" + port + "/js/role-manager.js");
});