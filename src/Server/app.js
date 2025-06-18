// src/Server/app.js - CORRECTED VERSION: Only homepage auth, keep all other routes

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
  getCurrentUser,
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
  registratieRoutes = require("./ROUTES/registratie");
  authRoutes = require("./ROUTES/auth");
  bedrijfRoutes = require("./ROUTES/bedrijf");
  reservatiesRoutes = require("./ROUTES/reservaties");
  studentRoutes = require("./ROUTES/student");
  organisatorRoutes = require("./ROUTES/organisator");
  projectRoutes = require("./ROUTES/project");
  console.log("✅ All route modules loaded successfully");
} catch (error) {
  console.error("❌ Error loading route modules:", error.message);
  process.exit(1);
}

// ===== EXPRESS CONFIGURATION =====
app.use(
  cors({
    origin: ["http://localhost:8383", "http://localhost:3301"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  const qs =
    req.query && Object.keys(req.query).length
      ? "?" + new URLSearchParams(req.query).toString()
      : "";
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}${qs}`);
  next();
});

// ===== STATIC FILE SERVING =====
app.use(express.static(path.join(__dirname, "../CareerLaunch")));
app.use(express.static(path.join(__dirname, "../../public")));
app.use("/src/CSS", express.static(path.join(__dirname, "../CSS")));
app.use("/src/JS", express.static(path.join(__dirname, "../JS")));
app.use("/images", express.static(path.join(__dirname, "../../public/images")));

// ===== FIXED DYNAMIC SCRIPTS - NO MORE DUPLICATE CLASSES =====

// Navigation Manager - Full script with EnhancedNavigationManager
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

// Role Manager - Just utilities, NO class declaration
app.get("/js/role-manager.js", async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Generate a simple utility script that doesn't redeclare classes
    const utilityScript = `
/**
 * 🔧 ROLE MANAGER UTILITIES - NO CLASS REDECLARATION
 * Simple utilities without class redeclaration
 * Generated at: ${new Date().toISOString()}
 */

console.log('🔧 Role Manager utilities loaded');

// Simple utility functions that don't conflict with navigation manager
window.roleUtilities = {
  checkAuthStatus: () => window.navigationManager ? window.navigationManager.isLoggedIn() : false,
  getUserType: () => window.navigationManager ? window.navigationManager.getUserType() : 'guest',
  getCurrentUser: () => window.navigationManager ? window.navigationManager.getUser() : null,
  refreshUI: () => window.navigationManager ? window.navigationManager.refresh() : null
};

// Backward compatibility
window.checkAuthStatus = window.roleUtilities.checkAuthStatus;
window.getUserType = window.roleUtilities.getUserType;
window.refreshRoleUI = window.roleUtilities.refreshUI;

// Toggle menu function
function toggleMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.querySelector('.menu-overlay');
  
  if (sideMenu && overlay) {
    const isOpen = sideMenu.classList.contains('active');
    
    if (isOpen) {
      sideMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      sideMenu.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

// Make toggle function global
window.toggleMenu = toggleMenu;

console.log('✅ Role utilities ready - no conflicts');
`;

    res.send(utilityScript);
  } catch (error) {
    console.error("❌ Error generating role manager utilities:", error);
    res.status(500).send("console.error('Failed to load role utilities');");
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
        contactpersonenAPI: "Added",
      },
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
    res
      .status(200)
      .json({ message: "📝 Factuur aangemaakt (email service niet actief)" });
  }
});

// ===== AUTH-PROTECTED HOMEPAGE ROUTES ONLY =====
console.log("🔒 Setting up AUTH-PROTECTED homepage routes...");

// Homepage route (/) - ONLY route with auth redirect logic
app.get("/", (req, res) => {
  console.log("🏠 Homepage (/) requested");
  const user = getCurrentUser(req);

  if (user) {
    console.log(`👤 Authenticated user detected: ${user.userType}`);

    // Redirect authenticated users to their specific homepage
    let targetHomepage;
    switch (user.userType) {
      case "student":
        targetHomepage = "/student-homepage";
        break;
      case "bedrijf":
        targetHomepage = "/bedrijf-homepage";
        break;
      case "organisator":
        targetHomepage = "/organisator-homepage";
        break;
      default:
        console.warn(
          `❓ Unknown user type: ${user.userType}, serving guest page`
        );
        return res.sendFile(guestHomepagePath);
    }

    console.log(`🔄 Redirecting ${user.userType} from / to ${targetHomepage}`);
    return res.redirect(targetHomepage);
  } else {
    console.log("👤 Guest user - serving guest homepage");
    return res.sendFile(guestHomepagePath);
  }
});

// Redirect index.html to /
app.get("/index.html", (req, res) => {
  console.log("🔄 Redirecting index.html to /");
  res.redirect("/");
});

// AUTH-PROTECTED role-specific homepages
app.get('/student-homepage', (req, res) => {
  const user = getCurrentUser(req);
  console.log('🔍 [ROUTE] /student-homepage - user:', user && user.email, '-', user && user.userType);
  if (!user) return res.redirect('/');
  if (user.userType !== 'student') {
    switch (user.userType) {
      case 'bedrijf': return res.redirect('/bedrijf-homepage');
      case 'organisator': return res.redirect('/organisator-homepage');
      default: return res.redirect('/');
    }
  }
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/student-homepage.html'));
});

app.get('/bedrijf-homepage', (req, res) => {
  const user = getCurrentUser(req);
  console.log('🔍 [ROUTE] /bedrijf-homepage - user:', user && user.email, '-', user && user.userType);
  if (!user) return res.redirect('/');
  if (user.userType !== 'bedrijf') {
    switch (user.userType) {
      case 'student': return res.redirect('/student-homepage');
      case 'organisator': return res.redirect('/organisator-homepage');
      default: return res.redirect('/');
    }
  }
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/homepage-bedrijf.html'));
});

app.get('/organisator-homepage', (req, res) => {
  const user = getCurrentUser(req);
  console.log('🔍 [ROUTE] /organisator-homepage - user:', user && user.email, '-', user && user.userType);
  if (!user) return res.redirect('/');
  if (user.userType !== 'organisator') {
    switch (user.userType) {
      case 'student': return res.redirect('/student-homepage');
      case 'bedrijf': return res.redirect('/bedrijf-homepage');
      default: return res.redirect('/');
    }
  }
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/organisator-homepage.html'));
});

console.log("✅ AUTH-PROTECTED homepage routes loaded");

// ===== NORMAL PUBLIC PAGE ROUTES (NO AUTH REQUIRED) =====
console.log("📄 Setting up normal public page routes...");

// Public pages - anyone can access these (guests + logged in users)
app.get("/programma", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/PROGRAMMA/programma.html"));
});

app.get("/alle-bedrijven", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html")
  );
});

app.get("/alle-projecten", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/RESULTS/PROJECTEN/alle-projecten.html")
  );
});

app.get("/alle-studenten", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html")
  );
});

app.get("/zoekbalk-projecten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/zoekbalk-projecten.html"));
});

app.get("/zoekbalk-studenten", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/zoekbalk-studenten.html"));
});

app.get("/resultaat-bedrijf", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/RESULTS/resultaat-bedrijf.html")
  );
});

app.get("/resultaat-student", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/RESULTS/resultaat-student.html")
  );
});

app.get("/conversations", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/GESPREKKEN/conversations.html")
  );
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/register.html"));
});

app.get("/programmaVoormidag", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/PROGRAMMA/programma-voormidag.html")
  );
});

app.get("/programmaNamidag", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/PROGRAMMA/programma-namidag.html")
  );
});

// INFO pages
app.get("/info", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/INFO/info.html"));
});

// Test page
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/test.html"));
});

// Add all your other normal page routes here...
// These work for everyone - no auth required

console.log("✅ Normal public page routes loaded");

// ===== AUTH-REQUIRED ACCOUNT PAGES =====
console.log("🔐 Setting up auth-required account routes...");

// ===== STUDENT ACCOUNT ROUTES =====
app.get("/account-student", requireAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/STUDENTEN/account-student.html")
  );
});

app.get("/gegevens-student", requireAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/STUDENTEN/gegevens-student.html")
  );
});

app.get("/mijn-project", requireRole(["student"]), (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/STUDENTEN/mijn-project.html")
  );
});

// ===== BEDRIJF ACCOUNT ROUTES =====
app.get("/account-bedrijf", requireAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/BEDRIJVEN/account-bedrijf.html")
  );
});

app.get("/gegevens-bedrijf", requireAuth, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/BEDRIJVEN/gegevens-bedrijf.html")
  );
});

app.get("/tarieven", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../../src/HTML/BEDRIJVEN/tarieven.html"));
});

// ===== ORGANISATOR ACCOUNT ROUTES =====
app.get("/account-organisator", requireRole(["organisator"]), (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/ORGANISATOR/account-organisator.html")
  );
});

app.get("/gegevens-organisator", requireRole(["organisator"]), (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/ORGANISATOR/gegevens-organisator.html")
  );
});

app.get("/admin-panel", requireRole(["organisator"]), (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../src/HTML/ORGANISATOR/admin-panel.html")
  );
});

app.get("/overzicht-organisator", requireRole(["organisator"]), (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "../../src/HTML/ORGANISATOR/overzicht-organisator.html"
    )
  );
});

// ===== GENERAL ACCOUNT ROUTES (from ACCOUNT folder) =====
// Check if these exist in your ACCOUNT folder and add them if needed
// app.get("/account-bedrijf-general", requireAuth, (req, res) => {
//   res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/account-bedrijf.html"));
// });

// app.get("/account-student-general", requireAuth, (req, res) => {
//   res.sendFile(path.join(__dirname, "../../src/HTML/ACCOUNT/account-student.html"));
// });

console.log("✅ Auth-required account routes loaded");

// ===== DEBUG ENDPOINT =====
app.get("/debug/auth", (req, res) => {
  const user = getCurrentUser(req);

  res.json({
    authenticated: !!user,
    user: user
      ? {
          email: user.email,
          userType: user.userType,
          userId: user.userId,
        }
      : null,
    headers: {
      authorization: !!req.headers.authorization,
      cookie: !!req.headers.cookie,
      cookieContent: req.headers.cookie || "none",
    },
    path: req.path,
    timestamp: new Date().toISOString(),
    message: user ? `Authenticated as ${user.userType}` : "Not authenticated",
  });
});

// ===== LEGACY REDIRECTS =====
function redirectWithParams(oldPath, newPath) {
  return (req, res) => {
    const qs = req.url.includes("?")
      ? req.url.substring(req.url.indexOf("?"))
      : "";
    const target = newPath + qs;
    console.log(`🔄 Legacy redirect: ${oldPath}${qs} → ${target}`);
    res.redirect(target);
  };
}

app.get(
  "/accountStudent",
  requireAuth,
  redirectWithParams("/accountStudent", "/account-student")
);
app.get(
  "/gegevensStudent",
  requireAuth,
  redirectWithParams("/gegevensStudent", "/gegevens-student")
);
app.get(
  "/mijnProject",
  requireRole(["student"]),
  redirectWithParams("/mijnProject", "/mijn-project")
);
// Add remaining legacy routes for bedrijf, student, project, programma, etc.

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
      path: req.path,
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
  const qs =
    req.query && Object.keys(req.query).length
      ? "?" + new URLSearchParams(req.query).toString()
      : "";
  console.log(`❓ 404 - Route not found: ${req.method} ${req.path}${qs}`);
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "API endpoint not found",
      path: req.path,
      method: req.method,
    });
  }
  if (req.path === "/account") return res.redirect("/login");
  res.redirect("/");
});

// ===== SERVER STARTUP =====
app.listen(port, () => {
  console.log(`🎓 CareerLaunch Server running on http://localhost:${port}`);
});

console.log("✅ CareerLaunch Frontend Server Setup Complete");

function redirectToHomepage(userType) {
    console.log('🚀 redirectToHomepage aangeroepen met userType:', userType);
    let targetUrl;
    switch(userType) {
        case 'student':
            targetUrl = '/student-homepage';
            break;
        case 'bedrijf':
            targetUrl = '/bedrijf-homepage';
            break;
        case 'organisator':
            targetUrl = '/organisator-homepage';
            break;
        default:
            targetUrl = '/';
    }
    console.log(`🚀 Redirecting to: ${targetUrl}`);
    window.location.href = targetUrl;
}
