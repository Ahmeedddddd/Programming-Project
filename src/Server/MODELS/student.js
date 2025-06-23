//src/Server/MODELS/student.js
const { pool } = require('../CONFIG/database');
const logger = require('../UTILS/logger');

class Student {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT
        studentnummer, voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
        overMezelf, huisnummer, straatnaam, gemeente, postcode, bus,
        tafelNr, leerjaar, technologieen
      FROM STUDENT
      ORDER BY achternaam, voornaam
    `);
    return rows;
  }

  static async getById(studentnummer) {
    const [rows] = await pool.query(
      'SELECT * FROM STUDENT WHERE studentnummer = ?',
      [studentnummer]
    );
    return rows[0];
  }

  static async getProjectDetailsByStudentId(studentId) {
    console.log(`🔍 [DEBUG] getProjectDetailsByStudentId called with studentId: ${studentId}`);
    const db = pool;
    try {
        console.log(`🔍 [DEBUG] About to query student with ID: ${studentId}`);
        
        // Get the student's project info directly from STUDENT table (INCLUDING tafelNr)
        const [studentRows] = await db.query(
            `SELECT s.*
             FROM STUDENT s
             WHERE s.studentnummer = ?`,
            [studentId]
        );

        console.log(`🔍 [DEBUG] Student query completed. Found ${studentRows.length} rows`);

        if (studentRows.length === 0) {
            console.log(`🔍 [DEBUG] No student found with ID: ${studentId}`);
            return null;
        }

        const student = studentRows[0];
        console.log(`🔍 [DEBUG] Student found:`, {
            studentnummer: student.studentnummer,
            naam: `${student.voornaam} ${student.achternaam}`,
            projectTitel: student.projectTitel,
            tafelNr: student.tafelNr,
            hasProject: !!(student.projectTitel && student.projectTitel.trim() !== '')
        });

        // If student has no project, return student details only
        if (!student.projectTitel || student.projectTitel.trim() === '') {
            console.log(`🔍 [DEBUG] Student has no project, returning student details only`);
            return {
                ...student,
                isProject: false,
                team: [student],
                technologieen: null
            };
        }

        console.log(`🔍 [DEBUG] Student has project: "${student.projectTitel}". Looking for team members...`);

        // Find all students working on the same project (INCLUDING tafelNr)
        const [teamRows] = await db.query(
            `SELECT s.studentnummer, s.voornaam, s.achternaam, s.email, s.opleiding, s.opleidingsrichting, s.gemeente, s.tafelNr
             FROM STUDENT s
             WHERE s.projectTitel = ? AND s.projectTitel IS NOT NULL AND s.projectTitel != ''
             ORDER BY s.achternaam, s.voornaam`,
            [student.projectTitel]
        );

        console.log(`🔍 [DEBUG] Team query completed. Found ${teamRows.length} team members:`, teamRows.map(s => ({
            naam: `${s.voornaam} ${s.achternaam}`,
            studentnummer: s.studentnummer,
            tafelNr: s.tafelNr
        })));

        // Get all technologies for students in this project
        const studentIds = teamRows.map(s => s.studentnummer);
        let technologies = [];
        
        console.log(`🔍 [DEBUG] Looking for technologies for student IDs:`, studentIds);
        
        if (studentIds.length > 0) {
            console.log(`🔍 [DEBUG] About to query technologies...`);
            
            // First, let's check if the TECHNOLOGIE and STUDENT_TECHNOLOGIE tables exist and have data
            try {
                const [techTableCheck] = await db.query('SHOW TABLES LIKE "TECHNOLOGIE"');
                console.log(`🔍 [DEBUG] TECHNOLOGIE table exists: ${techTableCheck.length > 0}`);
                
                const [studentTechTableCheck] = await db.query('SHOW TABLES LIKE "STUDENT_TECHNOLOGIE"');
                console.log(`🔍 [DEBUG] STUDENT_TECHNOLOGIE table exists: ${studentTechTableCheck.length > 0}`);
                
                if (techTableCheck.length > 0) {
                    const [techCount] = await db.query('SELECT COUNT(*) as count FROM TECHNOLOGIE');
                    console.log(`🔍 [DEBUG] TECHNOLOGIE table has ${techCount[0].count} records`);
                }
                
                if (studentTechTableCheck.length > 0) {
                    const [studentTechCount] = await db.query('SELECT COUNT(*) as count FROM STUDENT_TECHNOLOGIE');
                    console.log(`🔍 [DEBUG] STUDENT_TECHNOLOGIE table has ${studentTechCount[0].count} records`);
                    
                    // Check if any of our students have technology records
                    const [studentTechCheck] = await db.query(
                        `SELECT COUNT(*) as count FROM STUDENT_TECHNOLOGIE WHERE studentnummer IN (${studentIds.map(() => '?').join(',')})`,
                        studentIds
                    );
                    console.log(`🔍 [DEBUG] Found ${studentTechCheck[0].count} technology records for our students`);
                }
            } catch (error) {
                console.error(`🔍 [DEBUG] Error checking technology tables:`, error);
            }
            
            // Now try to get the actual technologies
            try {
                const [techRows] = await db.query(
                    `SELECT DISTINCT t.naam
                     FROM TECHNOLOGIE t
                     JOIN STUDENT_TECHNOLOGIE st ON t.technologieId = st.technologieId
                     WHERE st.studentnummer IN (${studentIds.map(() => '?').join(',')})
                     ORDER BY t.naam`,
                    studentIds
                );
                technologies = techRows.map(t => t.naam);
                console.log(`🔍 [DEBUG] Technologies query completed. Found ${technologies.length} technologies:`, technologies);
            } catch (error) {
                console.error(`🔍 [DEBUG] Error querying technologies:`, error);
                console.error(`🔍 [DEBUG] Technology query error details:`, {
                    message: error.message,
                    code: error.code,
                    sqlState: error.sqlState
                });
                technologies = []; // Set empty array on error
            }
        }

        // Get the table number from the first team member who has one
        const tafelNr = teamRows.find(s => s.tafelNr)?.tafelNr || null;
        console.log(`🔍 [DEBUG] Table number determined: ${tafelNr}`);

        // Combine all data into a single response object
        const projectDetails = {
            id: student.studentnummer, // Use student ID as project identifier
            isProject: true,
            titel: student.projectTitel,
            beschrijving: student.projectBeschrijving,
            tafelNr: tafelNr, // Use table number from team members
            team: teamRows,
            technologieen: technologies.join(', ')
        };

        console.log(`🔍 [DEBUG] Project details constructed successfully:`, {
            id: projectDetails.id,
            titel: projectDetails.titel,
            teamSize: projectDetails.team.length,
            tafelNr: projectDetails.tafelNr,
            technologies: projectDetails.technologieen,
            technologiesCount: technologies.length,
            teamMembers: projectDetails.team.map(t => `${t.voornaam} ${t.achternaam}`)
        });

        return projectDetails;
    } catch (error) {
        console.error(`❌ [DEBUG] Error in getProjectDetailsByStudentId for student ID ${studentId}:`, error);
        console.error(`❌ [DEBUG] Error stack:`, error.stack);
        throw error;
    }
  }

  static async create(studentData) {
    const {
      studentnummer, voornaam, achternaam, email, gsm_nummer,
      opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
      overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
    } = studentData;

    const [result] = await pool.query(`
      INSERT INTO STUDENT (
        studentnummer, voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
        overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      studentnummer, voornaam, achternaam, email, gsm_nummer,
      opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
      overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
    ]);
   
    return result.insertId;
  }  static async update(studentnummer, studentData) {
    try {
      const fields = Object.keys(studentData);
      const values = Object.values(studentData);
      
      if (fields.length === 0) {
        return 0;
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE STUDENT SET ${setClause} WHERE studentnummer = ?`;
      const params = [...values, studentnummer];
      
      const [result] = await pool.query(query, params);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error in Student.update:', error);
      throw error;
    }
  }

  static async delete(studentnummer) {
    const [result] = await pool.query(
      'DELETE FROM STUDENT WHERE studentnummer = ?',
      [studentnummer]
    );
    return result.affectedRows;
  }
  static async getWithProjects() {
    try {
      console.log('🔍 [DEBUG] Executing getWithProjects query (JOIN TECHNOLOGIE)...');
      const [rows] = await pool.query(`
        SELECT
            s.projectTitel,
            MAX(s.projectBeschrijving) as projectBeschrijving,
            GROUP_CONCAT(DISTINCT t.naam ORDER BY t.naam SEPARATOR ', ') as technologieen,
            GROUP_CONCAT(DISTINCT CONCAT(s.voornaam, ' ', s.achternaam) ORDER BY s.achternaam, s.voornaam SEPARATOR ', ') as studenten,
            COUNT(DISTINCT s.studentnummer) as aantalStudenten
        FROM
            STUDENT s
        LEFT JOIN STUDENT_TECHNOLOGIE st ON s.studentnummer = st.studentnummer
        LEFT JOIN TECHNOLOGIE t ON st.technologieId = t.technologieId
        WHERE s.projectTitel IS NOT NULL AND s.projectTitel != ''
        GROUP BY s.projectTitel
        ORDER BY s.projectTitel;
      `);
      console.log(`📊 Found ${rows.length} projects after grouping (with technologies).`);
      console.log('✅ [DEBUG] Projects loaded successfully (with technologies):', JSON.stringify(rows, null, 2));
      return rows;
    } catch (error) {
        console.error('Error fetching projects with students and technologies:', error);
        console.error('❌ [DEBUG] Error in getWithProjects (with technologies):', error.message);
        throw error;
    }
  }

  // NEW METHOD: Get projects with individual student IDs for navigation
  static async getProjectsWithStudentIds() {
    try {
      console.log('🔍 [DEBUG] Executing getProjectsWithStudentIds query...');
      
      // First, get all students with projects and their technologies (removed tafelNr)
      const [rows] = await pool.query(`
        SELECT
            s.projectTitel,
            s.projectBeschrijving,
            s.studentnummer,
            s.voornaam,
            s.achternaam,
            s.opleiding,
            GROUP_CONCAT(DISTINCT t.naam ORDER BY t.naam SEPARATOR ', ') as technologieen
        FROM
            STUDENT s
        LEFT JOIN STUDENT_TECHNOLOGIE st ON s.studentnummer = st.studentnummer
        LEFT JOIN TECHNOLOGIE t ON st.technologieId = t.technologieId
        WHERE s.projectTitel IS NOT NULL AND s.projectTitel != ''
        GROUP BY s.projectTitel, s.projectBeschrijving, s.studentnummer, s.voornaam, s.achternaam, s.opleiding
        ORDER BY s.projectTitel, s.achternaam, s.voornaam;
      `);
      
      // Group by project title and create student arrays
      const groupedProjects = {};
      rows.forEach(row => {
        const projectTitle = row.projectTitel;
        if (!groupedProjects[projectTitle]) {
          groupedProjects[projectTitle] = {
            titel: projectTitle,
            beschrijving: row.projectBeschrijving,
            technologieen: row.technologieen || '',
            studenten: []
          };
        }
        
        groupedProjects[projectTitle].studenten.push({
          id: row.studentnummer,
          naam: `${row.voornaam} ${row.achternaam}`,
          opleiding: row.opleiding,
          tafelNr: null // No table number since TAFEL table doesn't exist
        });
      });
      
      const result = Object.values(groupedProjects);
      console.log(`📊 Found ${result.length} unique projects with student IDs and technologies.`);
      console.log('✅ [DEBUG] Projects with student IDs and technologies loaded successfully:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
        console.error('Error fetching projects with student IDs:', error);
        console.error('❌ [DEBUG] Error in getProjectsWithStudentIds:', error.message);
        throw error;
    }
  }

  // ===== STATISTICS METHODS =====

  static async getStats() {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM STUDENT');
      const [withProjectsRows] = await pool.query(`
        SELECT COUNT(*) as withProjects FROM STUDENT 
        WHERE projectTitel IS NOT NULL AND projectTitel != ''
      `);
      const [opleidingStats] = await pool.query(`
        SELECT opleiding, COUNT(*) as count 
        FROM STUDENT 
        WHERE opleiding IS NOT NULL AND opleiding != ''
        GROUP BY opleiding
        ORDER BY count DESC
      `);
      const [opleidingsrichtingStats] = await pool.query(`
        SELECT opleidingsrichting, COUNT(*) as count 
        FROM STUDENT 
        WHERE opleidingsrichting IS NOT NULL AND opleidingsrichting != ''
        GROUP BY opleidingsrichting
        ORDER BY count DESC
      `);
      
      return {
        total: totalRows[0].total,
        withProjects: withProjectsRows[0].withProjects,
        withoutProjects: totalRows[0].total - withProjectsRows[0].withProjects,
        byOpleiding: opleidingStats.reduce((acc, stat) => {
          acc[stat.opleiding] = stat.count;
          return acc;
        }, {}),
        byOpleidingsrichting: opleidingsrichtingStats.reduce((acc, stat) => {
          acc[stat.opleidingsrichting] = stat.count;
          return acc;
        }, {}),
        topOpleidingen: opleidingStats.slice(0, 5),
        topOpleidingsrichtingen: opleidingsrichtingStats.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      return { 
        total: 0, 
        withProjects: 0, 
        withoutProjects: 0, 
        byOpleiding: {}, 
        byOpleidingsrichting: {},
        topOpleidingen: [],
        topOpleidingsrichtingen: []
      };
    }
  }

  static async getRecent(limit = 5) {
    try {
      const [rows] = await pool.query(`
        SELECT studentnummer, voornaam, achternaam, email, opleiding, projectTitel
        FROM STUDENT 
        ORDER BY studentnummer DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent students:', error);
      return [];
    }
  }

  // ===== ADDITIONAL UTILITY METHODS =====

  static async getByOpleiding(opleiding) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM STUDENT WHERE opleiding = ? ORDER BY achternaam, voornaam',
        [opleiding]
      );
      return rows;
    } catch (error) {
      console.error('Error getting students by opleiding:', error);
      return [];
    }
  }

  static async getByOpleidingsrichting(opleidingsrichting) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM STUDENT WHERE opleidingsrichting = ? ORDER BY achternaam, voornaam',
        [opleidingsrichting]
      );
      return rows;
    } catch (error) {
      console.error('Error getting students by opleidingsrichting:', error);
      return [];
    }
  }

  static async searchByName(searchTerm) {
    try {
      const [rows] = await pool.query(`
        SELECT studentnummer, voornaam, achternaam, email, opleiding, opleidingsrichting, gemeente
        FROM STUDENT 
        WHERE voornaam LIKE ? OR achternaam LIKE ? OR email LIKE ? OR projectTitel LIKE ?
        ORDER BY achternaam, voornaam
        LIMIT 20
      `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
      return rows;
    } catch (error) {
      console.error('Error searching students:', error);
      return [];
    }
  }

  static async getWithoutProjects() {
    try {
      const [rows] = await pool.query(`
        SELECT studentnummer, voornaam, achternaam, email, opleiding, opleidingsrichting
        FROM STUDENT 
        WHERE projectTitel IS NULL OR projectTitel = ''
        ORDER BY achternaam, voornaam
      `);
      return rows;
    } catch (error) {
      console.error('Error getting students without projects:', error);
      return [];
    }
  }

  static async getByGemeente(gemeente) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM STUDENT WHERE gemeente = ? ORDER BY achternaam, voornaam',
        [gemeente]
      );
      return rows;
    } catch (error) {
      console.error('Error getting students by gemeente:', error);
      return [];
    }
  }

  // ===== ADVANCED SEARCH METHODS =====

  static async advancedSearch(filters) {
    try {
      let whereConditions = [];
      let queryParams = [];

      if (filters.opleiding) {
        whereConditions.push('opleiding = ?');
        queryParams.push(filters.opleiding);
      }

      if (filters.opleidingsrichting) {
        whereConditions.push('opleidingsrichting = ?');
        queryParams.push(filters.opleidingsrichting);
      }

      if (filters.gemeente) {
        whereConditions.push('gemeente = ?');
        queryParams.push(filters.gemeente);
      }

      if (filters.hasProject !== undefined) {
        if (filters.hasProject) {
          whereConditions.push('projectTitel IS NOT NULL AND projectTitel != ""');
        } else {
          whereConditions.push('(projectTitel IS NULL OR projectTitel = "")');
        }
      }

      if (filters.searchTerm) {
        whereConditions.push('(voornaam LIKE ? OR achternaam LIKE ? OR email LIKE ? OR projectTitel LIKE ?)');
        const searchPattern = `%${filters.searchTerm}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const [rows] = await pool.query(`
        SELECT studentnummer, voornaam, achternaam, email, opleiding, opleidingsrichting, 
               projectTitel, gemeente, postcode
        FROM STUDENT 
        ${whereClause}
        ORDER BY achternaam, voornaam
        LIMIT 50
      `, queryParams);

      return rows;
    } catch (error) {
      console.error('Error performing advanced search:', error);
      return [];
    }
  }
}

module.exports = Student;