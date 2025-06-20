// src/Server/ROUTES/project.js - FIXED VERSION

const express = require('express');
const router = express.Router();
const studentController = require('../CONTROLLERS/studentController');

// ===== PROJECT ROUTES - FIXED =====

// GET /api/projecten - Alle projecten ophalen (FIXED)
router.get('/', async (req, res) => {
    try {
        console.log('📡 Fetching all projects...');
        
        // FIXED: Direct database call instead of controller wrapper
        const Student = require('../MODELS/student');
        
        // Get limit parameter from query
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        // Get all students first
        const allStudents = await Student.getAll();
        console.log(`📊 Found ${allStudents.length} total students`);
        
        // Filter students that have projects and transform to project format
        let projects = allStudents
            .filter(student => {
                const hasProject = student.projectTitel && 
                                 student.projectTitel.trim() !== '' && 
                                 student.projectTitel.toLowerCase() !== 'geen' &&
                                 student.projectTitel.toLowerCase() !== 'nvt';
                
                if (hasProject) {
                    console.log(`✅ Student ${student.studentnummer} has project: ${student.projectTitel}`);
                }
                return hasProject;
            })
            .map(student => {
                // Transform student data to project-focused format
                return {
                    id: student.studentnummer,
                    projectId: student.studentnummer,
                    titel: student.projectTitel,
                    beschrijving: student.projectBeschrijving || 'Geen beschrijving beschikbaar',
                    technologieën: student.technologieën || null,
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
                    leerjaar: student.leerjaar || 3,
                    // Include additional fields for compatibility
                    projectTitel: student.projectTitel,
                    projectBeschrijving: student.projectBeschrijving
                };
            });
        
        const totalProjects = projects.length;

        // Apply limit if specified
        if (limit && limit > 0) {
            projects = projects.slice(0, limit);
            console.log(`📊 Limited to ${limit} projects`);
        }
        
        console.log(`📊 Found ${projects.length} projects from ${allStudents.length} students`);
        
        // Always return successful response, even if no projects
        res.json({
            success: true,
            data: projects,
            count: projects.length,
            total: totalProjects,
            total_students: allStudents.length,
            limit: limit,
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

// GET /api/projecten/:id - Specifiek project ophalen (FIXED)
router.get('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log(`📡 Fetching project with ID: ${projectId}`);
        
        // FIXED: Direct model call
        const Student = require('../MODELS/student');
        const student = await Student.getById(projectId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found',
                message: 'Student niet gevonden'
            });
        }
        
        // Check if student has a project
        if (!student.projectTitel || 
            student.projectTitel.trim() === '' || 
            student.projectTitel.toLowerCase() === 'geen' ||
            student.projectTitel.toLowerCase() === 'nvt') {
            
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
            titel: student.projectTitel,
            beschrijving: student.projectBeschrijving || 'Geen beschrijving beschikbaar',
            technologieën: student.technologieën || null,
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
            leerjaar: student.leerjaar || 3,
            // Include all student data for the detail page
            projectTitel: student.projectTitel,
            projectBeschrijving: student.projectBeschrijving,
            ...student
        };
        
        res.json({
            success: true,
            data: project,
            message: 'Project loaded successfully'
        });
        
    } catch (error) {
        console.error('❌ Error fetching project:', error);
        
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
        const Student = require('../MODELS/student');
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
                technologieën: student.technologieën || null,
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

// GET /api/projecten/stats - Project statistieken
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Fetching project stats...');
        
        const Student = require('../MODELS/student');
        const allStudents = await Student.getAll();
        
        const projectCount = allStudents.filter(student => 
            student.projectTitel && 
            student.projectTitel.trim() !== '' && 
            student.projectTitel.toLowerCase() !== 'geen' &&
            student.projectTitel.toLowerCase() !== 'nvt'
        ).length;
        
        const stats = {
            totalProjects: projectCount,
            totalStudents: allStudents.length,
            projectPercentage: Math.round((projectCount / allStudents.length) * 100),
            studentsWithoutProjects: allStudents.length - projectCount
        };
        
        res.json({
            success: true,
            data: stats,
            message: 'Project statistics loaded successfully'
        });
        
    } catch (error) {
        console.error('❌ Error fetching project stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project statistics',
            message: 'Er ging iets mis bij het ophalen van project statistieken'
        });
    }
});

module.exports = router;