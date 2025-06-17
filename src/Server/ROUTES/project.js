// src/Server/ROUTES/project.js
// Project-specific routes that use the student data structure

const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');

// ===== PROJECT ROUTES =====

// GET /api/projecten - Alle projecten ophalen
router.get('/', async (req, res) => {
    try {
        console.log('📡 Fetching all projects...');
        
        // Use the existing student controller to get students with projects
        const studentRequest = {
            query: { hasProject: 'true', ...req.query }
        };
        
        // Create a mock response object to capture the student data
        const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ ...data, status: code }) })
        };
        
        // Get students with projects
        const result = await studentController.getStudentsWithProjects(studentRequest, mockRes);
        
        // Transform student data to project-focused format
        if (result && result.data) {
            const projects = result.data.map(student => ({
                id: student.studentnummer, // Use studentnummer as project ID
                projectId: student.studentnummer,
                projectTitel: student.projectTitel,
                projectBeschrijving: student.projectBeschrijving,
                studentnummer: student.studentnummer,
                studentNaam: `${student.voornaam} ${student.achternaam}`,
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
                message: 'Projects loaded successfully'
            });
        } else {
            res.json({
                success: true,
                data: [],
                count: 0,
                message: 'No projects found'
            });
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: 'Er ging iets mis bij het ophalen van de projecten'
        });
    }
});

// GET /api/projecten/:id - Specifiek project ophalen (using student ID)
router.get('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log(`📡 Fetching project with ID: ${projectId}`);
        
        // Use student controller to get the student/project data
        const studentRequest = { params: { studentnummer: projectId } };
        const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ ...data, status: code }) })
        };
        
        const result = await studentController.getStudent(studentRequest, mockRes);
        
        if (result && result.data) {
            const student = result.data;
            
            // Check if student has a project
            if (!student.projectTitel || student.projectTitel.trim() === '') {
                return res.status(404).json({
                    success: false,
                    error: 'Project not found',
                    message: 'Deze student heeft geen project'
                });
            }
            
            // Transform to project format
            const project = {
                id: student.studentnummer,
                projectId: student.studentnummer,
                projectTitel: student.projectTitel,
                projectBeschrijving: student.projectBeschrijving,
                studentnummer: student.studentnummer,
                studentNaam: `${student.voornaam} ${student.achternaam}`,
                voornaam: student.voornaam,
                achternaam: student.achternaam,
                email: student.email,
                opleiding: student.opleiding,
                opleidingsrichting: student.opleidingsrichting,
                tafelNr: student.tafelNr,
                leerjaar: student.leerjaar || 3,
                // Include all student data for the detail page
                ...student
            };
            
            res.json({
                success: true,
                data: project,
                message: 'Project loaded successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Project not found',
                message: 'Project niet gevonden'
            });
        }
    } catch (error) {
        console.error('Error fetching project:', error);
        if (error.message && error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
                message: 'Project niet gevonden'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch project',
                message: 'Er ging iets mis bij het ophalen van het project'
            });
        }
    }
});

// GET /api/projecten/search/:searchTerm - Zoeken in projecten
router.get('/search/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        console.log(`🔍 Searching projects for: ${searchTerm}`);
        
        // Use student search but filter for projects
        const studentRequest = { 
            params: { searchTerm },
            query: { hasProject: 'true' }
        };
        const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ ...data, status: code }) })
        };
        
        const result = await studentController.searchStudents(studentRequest, mockRes);
        
        if (result && result.data) {
            // Filter out students without projects and transform
            const projects = result.data
                .filter(student => student.projectTitel && student.projectTitel.trim() !== '')
                .map(student => ({
                    id: student.studentnummer,
                    projectId: student.studentnummer,
                    projectTitel: student.projectTitel,
                    projectBeschrijving: student.projectBeschrijving,
                    studentnummer: student.studentnummer,
                    studentNaam: `${student.voornaam} ${student.achternaam}`,
                    voornaam: student.voornaam,
                    achternaam: student.achternaam,
                    email: student.email,
                    opleiding: student.opleiding,
                    opleidingsrichting: student.opleidingsrichting,
                    tafelNr: student.tafelNr
                }));
            
            res.json({
                success: true,
                data: projects,
                count: projects.length,
                searchTerm: searchTerm,
                message: `Found ${projects.length} projects matching "${searchTerm}"`
            });
        } else {
            res.json({
                success: true,
                data: [],
                count: 0,
                searchTerm: searchTerm,
                message: 'No projects found'
            });
        }
    } catch (error) {
        console.error('Error searching projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search projects',
            message: 'Er ging iets mis bij het zoeken naar projecten'
        });
    }
});

// GET /api/projecten/category/:category - Projecten per categorie
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        console.log(`📂 Fetching projects in category: ${category}`);
        
        // Map categories to opleidingsrichting filters
        let opleidingsrichtingFilter = null;
        switch (category.toLowerCase()) {
            case 'ai':
            case 'robotica':
                opleidingsrichtingFilter = 'AI,Robotica,Intelligent';
                break;
            case 'web':
            case 'software':
                opleidingsrichtingFilter = 'Software,Web';
                break;
            case 'hardware':
            case 'iot':
                opleidingsrichtingFilter = 'Hardware,IoT,Embedded';
                break;
            case 'security':
            case 'cybersecurity':
                opleidingsrichtingFilter = 'Security,Cybersecurity';
                break;
        }
        
        const studentRequest = {
            query: { 
                hasProject: 'true',
                opleidingsrichting: opleidingsrichtingFilter
            }
        };
        const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ ...data, status: code }) })
        };
        
        const result = await studentController.getAllStudents(studentRequest, mockRes);
        
        if (result && result.data) {
            const projects = result.data
                .filter(student => student.projectTitel && student.projectTitel.trim() !== '')
                .map(student => ({
                    id: student.studentnummer,
                    projectTitel: student.projectTitel,
                    projectBeschrijving: student.projectBeschrijving,
                    studentNaam: `${student.voornaam} ${student.achternaam}`,
                    opleiding: student.opleiding,
                    opleidingsrichting: student.opleidingsrichting
                }));
            
            res.json({
                success: true,
                data: projects,
                count: projects.length,
                category: category
            });
        } else {
            res.json({
                success: true,
                data: [],
                count: 0,
                category: category
            });
        }
    } catch (error) {
        console.error('Error fetching projects by category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects by category',
            message: 'Er ging iets mis bij het ophalen van projecten per categorie'
        });
    }
});

// GET /api/projecten/stats - Project statistieken
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Fetching project statistics...');
        
        // Get student stats and derive project stats
        const studentRequest = { query: {} };
        const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ ...data, status: code }) })
        };
        
        const result = await studentController.getStudentStats(studentRequest, mockRes);
        
        if (result && result.data) {
            const stats = result.data;
            
            res.json({
                success: true,
                data: {
                    totalProjects: stats.withProjects || 0,
                    studentsWithoutProjects: stats.withoutProjects || 0,
                    totalStudents: stats.total || 0,
                    projectsByOpleiding: stats.byOpleiding || {},
                    projectsByOpleidingsrichting: stats.byOpleidingsrichting || {},
                    topOpleidingen: stats.topOpleidingen || [],
                    topOpleidingsrichtingen: stats.topOpleidingsrichtingen || []
                },
                generatedAt: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                data: {
                    totalProjects: 0,
                    studentsWithoutProjects: 0,
                    totalStudents: 0,
                    projectsByOpleiding: {},
                    projectsByOpleidingsrichting: {},
                    topOpleidingen: [], 
                    topOpleidingsrichtingen: []
                }
            });
        }
    } catch (error) {
        console.error('Error fetching project statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project statistics',
            message: 'Er ging iets mis bij het ophalen van project statistieken'
        });
    }
});

module.exports = router;