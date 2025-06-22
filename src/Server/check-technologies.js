const mysql = require('mysql2/promise');
const config = require('./CONFIG/database.js');

async function checkTechnologies() {
    const pool = mysql.createPool(config);
    
    try {
        console.log('🔍 Checking projects and technologies in database...');
        
        const [rows] = await pool.query(`
            SELECT 
                projectTitel, 
                technologieen,
                COUNT(*) as student_count
            FROM STUDENT 
            WHERE projectTitel IS NOT NULL AND projectTitel != ''
            GROUP BY projectTitel, technologieen 
            ORDER BY projectTitel
        `);
        
        console.log(`📊 Found ${rows.length} unique project entries:`);
        console.log('');
        
        let projectsWithTech = 0;
        let projectsWithoutTech = 0;
        
        rows.forEach((row, index) => {
            const hasTech = row.technologieen && row.technologieen.trim() !== '';
            const status = hasTech ? '✅' : '❌';
            const techValue = row.technologieen || 'null';
            
            console.log(`${index + 1}. "${row.projectTitel}"`);
            console.log(`   Technologies: ${status} (${techValue})`);
            console.log(`   Students: ${row.student_count}`);
            console.log('');
            
            if (hasTech) {
                projectsWithTech++;
            } else {
                projectsWithoutTech++;
            }
        });
        
        console.log('📈 Summary:');
        console.log(`   Projects with technologies: ${projectsWithTech}`);
        console.log(`   Projects without technologies: ${projectsWithoutTech}`);
        console.log(`   Total unique projects: ${rows.length}`);
        
        // Also check the grouped query that's used in the API
        console.log('\n🔍 Checking grouped projects (as used by API):');
        const [groupedRows] = await pool.query(`
            SELECT
                s.projectTitel,
                MAX(s.projectBeschrijving) as projectBeschrijving,
                MAX(s.technologieen) as technologieen,
                GROUP_CONCAT(DISTINCT CONCAT(s.voornaam, ' ', s.achternaam) SEPARATOR ', ') as studenten
            FROM STUDENT s
            WHERE s.projectTitel IS NOT NULL AND s.projectTitel != ''
            GROUP BY s.projectTitel
            ORDER BY s.projectTitel
        `);
        
        console.log(`📊 Grouped projects (${groupedRows.length}):`);
        groupedRows.forEach((row, index) => {
            const hasTech = row.technologieen && row.technologieen.trim() !== '';
            const status = hasTech ? '✅' : '❌';
            console.log(`${index + 1}. "${row.projectTitel}" - Technologies: ${status} (${row.technologieen || 'null'})`);
        });
        
    } catch (error) {
        console.error('❌ Error checking technologies:', error);
    } finally {
        await pool.end();
    }
}

checkTechnologies(); 