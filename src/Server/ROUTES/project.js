// src/Server/ROUTES/project.js - FIXED VERSION

const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');
const Student = require('../MODELS/student'); // Import the model at the top

// ===== PROJECT ROUTES - FIXED =====

// GET /api/projecten - Alle projecten ophalen (FIXED)
router.get('/', async (req, res) => {
    try {
        console.log('📡 Fetching all projects using getWithProjects...');
        
        // Get limit parameter from query
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        let projects = await Student.getWithProjects();
        const totalProjects = projects.length;

        // Apply limit if specified
        if (limit && limit > 0) {
            projects = projects.slice(0, limit);
            console.log(`📊 Limited to ${limit} projects`);
        }
        
        console.log(`📊 Found ${projects.length} projects.`);
        
        // Always return successful response, even if no projects
        res.json({
            success: true,
            data: projects,
            count: projects.length,
            total: totalProjects,
            message: projects.length > 0 ? 'Projects loaded successfully' : 'No projects found'
        });
        
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: 'Er ging iets mis bij het ophalen van de projecten',
            details: error.message
        });
    }
});

// NEW ENDPOINT: GET /api/projecten/with-ids - Projecten met student IDs voor navigatie
router.get('/with-ids', async (req, res) => {
    try {
        console.log('📡 Fetching projects with student IDs for navigation...');
        
        // Get limit parameter from query
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        let projects = await Student.getProjectsWithStudentIds();
        const totalProjects = projects.length;

        // Apply limit if specified
        if (limit && limit > 0) {
            projects = projects.slice(0, limit);
            console.log(`📊 Limited to ${limit} projects`);
        }
        
        console.log(`📊 Found ${projects.length} projects with student IDs.`);
        
        // Always return successful response, even if no projects
        res.json({
            success: true,
            data: projects,
            count: projects.length,
            total: totalProjects,
            message: projects.length > 0 ? 'Projects with student IDs loaded successfully' : 'No projects found'
        });
        
    } catch (error) {
        console.error('❌ Error fetching projects with student IDs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects with student IDs',
            message: 'Er ging iets mis bij het ophalen van de projecten met student IDs',
            details: error.message
        });
    }
});

// GET /api/projecten/stats - Project statistieken
router.get("/stats", async (req, res) => {
  try {
    console.log("📊 Fetching project stats...");
    const stats = await Student.getStats(); // getStats contains project stats

    // FIXED: response format
    res.json({
      success: true,
      data: {
        total: stats.totalProjects, // Use totalProjects for the total count
      },
      message: "Project statistics loaded successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching project stats:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics',
      message: 'Er ging iets mis bij het ophalen van project statistieken'
    });
  }
});

// GET /api/projecten/:id - Specifiek project ophalen (FIXED)
router.get('/:id', async (req, res) => {
    try {
        const projectId = req.params.id; // This is actually a studentnummer
        console.log(`📡 [DEBUG] GET /api/projecten/:id called with projectId: ${projectId}`);
        console.log(`📡 [DEBUG] Request params:`, req.params);
        console.log(`📡 [DEBUG] Request query:`, req.query);
        
        console.log(`📡 Fetching project details using student ID: ${projectId}`);
        
        console.log(`📡 [DEBUG] About to call Student.getProjectDetailsByStudentId(${projectId})`);
        const project = await Student.getProjectDetailsByStudentId(projectId);
        console.log(`📡 [DEBUG] Student.getProjectDetailsByStudentId completed`);
        
        console.log(`📡 [DEBUG] Project result:`, project ? {
            id: project.id,
            isProject: project.isProject,
            titel: project.titel,
            hasTeam: !!project.team,
            teamSize: project.team ? project.team.length : 0
        } : 'null');
        
        if (!project) {
            console.log(`📡 [DEBUG] No project found, returning 404`);
            return res.status(404).json({
                success: false,
                error: 'Student not found',
                message: 'Student niet gevonden'
            });
        }
        
        if (!project.isProject) {
            console.log(`📡 [DEBUG] Student has no project, returning 404`);
            return res.status(404).json({
                success: false,
                error: 'Project not found', 
                message: 'Deze student heeft geen project toegewezen'
            });
        }
        
        console.log(`📡 [DEBUG] Project found, returning success response`);
        res.json({
            success: true,
            data: project,
            message: 'Project loaded successfully'
        });
        
    } catch (error) {
        console.error('❌ [DEBUG] Error in GET /api/projecten/:id route:', error);
        console.error('❌ [DEBUG] Error message:', error.message);
        console.error('❌ [DEBUG] Error stack:', error.stack);
        
        if (error.message && error.message.includes('not found')) {
            console.log(`📡 [DEBUG] Returning 404 for not found error`);
            res.status(404).json({
                success: false,
                error: 'Project not found',
                message: 'Project niet gevonden'
            });
        } else {
            console.log(`📡 [DEBUG] Returning 500 for server error`);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch project',
                message: 'Er ging iets mis bij het ophalen van het project',
                details: error.message
            });
        }
    }
});

// GET /api/projecten/search/:searchTerm - Zoeken in projecten (FIXED)
router.get('/search/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        console.log(`🔍 Searching projects for: ${searchTerm}`);
        
        // FIXED: Direct model search
        const searchResults = await Student.searchByName(searchTerm);
        
        // Filter for students with projects and transform
        const projects = searchResults
            .filter(student => {
                const hasProject = student.projectTitel && 
                                 student.projectTitel.trim() !== '' && 
                                 student.projectTitel.toLowerCase() !== 'geen' &&
                                 student.projectTitel.toLowerCase() !== 'nvt';
                
                // Also search in project title and description
                const projectMatch = hasProject && (
                    student.projectTitel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (student.projectBeschrijving && student.projectBeschrijving.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                
                return hasProject && (projectMatch || 
                    student.voornaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.achternaam.toLowerCase().includes(searchTerm.toLowerCase()));
            })
            .map(student => ({
                id: student.studentnummer,
                projectId: student.studentnummer,
                titel: student.projectTitel,
                beschrijving: student.projectBeschrijving || 'Geen beschrijving beschikbaar',
                studentnummer: student.studentnummer,
                studentnaam: `${student.voornaam} ${student.achternaam}`,
                studenten: [{
                    voornaam: student.voornaam,
                    achternaam: student.achternaam,
                    email: student.email,
                    studentnummer: student.studentnummer
                }],
                voornaam: student.voornaam,
                achternaam: student.achternaam,
                email: student.email,
                opleiding: student.opleiding,
                opleidingsrichting: student.opleidingsrichting,
                tafelNr: student.tafelNr,
                leerjaar: student.leerjaar || 3
            }));
        
        res.json({
            success: true,
            data: projects,
            count: projects.length,
            searchTerm: searchTerm,
            message: `Found ${projects.length} projects matching "${searchTerm}"`
        });
        
    } catch (error) {
        console.error('❌ Error searching projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search projects',
            message: 'Er ging iets mis bij het zoeken naar projecten',
            details: error.message
        });
    }
});

// Route om projectdetails op te halen op basis van student-ID
router.get('/details/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is vereist' });
        }
        
        console.log(`[API] Opvragen van projectdetails voor student ID: ${studentId}`);
        const projectDetails = await Student.getProjectDetailsByStudentId(studentId);
        
        if (projectDetails) {
            console.log(`[API] Projectdetails gevonden voor student ID: ${studentId}`);
            res.json({ success: true, data: projectDetails });
        } else {
            console.warn(`[API] Geen projectdetails gevonden voor student ID: ${studentId}`);
            res.status(404).json({ success: false, message: 'Project niet gevonden' });
        }
    } catch (error) {
        console.error(`[API] Fout bij het ophalen van projectdetails voor student ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Interne serverfout' });
    }
});

module.exports = router;
