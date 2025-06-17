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
  getCurrentUser
} = require("./MIDDLEWARE/rolCheck");

// ===== PATH TO GUEST HOMEPAGE =====
const guestHomepagePath = path.join(__dirname, "../../../public/index.html");

// ===== ROUTE IMPORTS =====
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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  const qs = req.query && Object.keys(req.query).length
    ? "?" + new URLSearchParams(req.query).toString()
    : "";
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}${qs}`);
  next();
});

// ===== ROLE-BASED HOMEPAGE =====
app.use(serveRoleBasedHomepage);

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

// ===== API ROUTES =====
console.log("🔗 Mounting API routes...");
app.get("/api/user-info", getUserInfo);
app.get("/api/stats/live", getLiveStats);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const { pool } = require("./CONFIG/database");
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.4.1",
      database: "connected",
      port,
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
      port,
    });
  }
});

// Mount API routers
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

// Email endpoint
app.post("/api/send-invoice", async (req, res) => {
  try {
    const { sendInvoice } = require("./SERVICES/emailServ");
    await sendInvoice(req.body);
    res.status(200).json({ message: "✅ Factuur verzonden!" });
  } catch (err) {
    console.error("❌ Email service niet gevonden:", err.message);
    res.status(200).json({ message: "📝 Factuur aangemaakt (email service niet actief)" });
  }
});

// ===== PAGE ROUTES =====
// Homepage (role-based)
app.get("/", (req, res) => {
  const user = getCurrentUser(req);
  if (user) return serveRoleBasedHomepage(req, res);
  res.sendFile(guestHomepagePath);
});
app.get("/index.html", (req, res) => res.redirect("/"));

// Role-based
app.get("/student-homepage", (req, res) =>
  res.sendFile(path.join(__dirname, "../../src/HTML/STUDENTEN/student-homepage.html"))
);
app.get("/bedrijf-homepage", (req, res) =>
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/homepage-bedrijf.html"))
);
app.get("/organisator-homepage", (req, res) =>
  res.sendFile(path.join(__dirname, "../../src/HTML/ORGANISATOR/organisator-homepage.html"))
);

// ... include all other page routes here (accounts, conversations,
// programma, alle-bedrijven, alle-projecten, zoekbalk-projecten, etc.)

// ===== LEGACY REDIRECTS =====
function redirectWithParams(oldPath, newPath) {
  return (req, res) => {
    const qs = req.url.includes('?')
      ? req.url.substring(req.url.indexOf('?'))
      : '';
    const target = newPath + qs;
    console.log(`🔄 Legacy redirect: ${oldPath}${qs} → ${target}`);
    res.redirect(target);
  };
}

app.get("/accountStudent", requireAuth, redirectWithParams("/accountStudent", "/account-student"));
app.get("/gegevensStudent", requireAuth, redirectWithParams("/gegevensStudent", "/gegevens-student"));
app.get("/mijnProject", requireRole(["student"]), redirectWithParams("/mijnProject", "/mijn-project"));
// ... add remaining legacy routes for bedrijf, student, project, programma, etc.

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Internal server error',
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
  const qs = req.query && Object.keys(req.query).length ?
    '?' + new URLSearchParams(req.query).toString() : '';
  console.log(`❓ 404 - Route not found: ${req.method} ${req.path}${qs}`);
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path, method: req.method });
  }
  if (req.path === '/account') return res.redirect('/login');
  res.redirect('/');
});

// ===== SERVER STARTUP =====
app.listen(port, () => {
  console.log(`🎓 CareerLaunch Server running on http://localhost:${port}`);
});
