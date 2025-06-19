// src/JS/UTILS/stat-utils.js - ESSENTIEEL UTILITY BESTAND

/**
 * 📊 STAT-UTILS - WAAROM DIT NOG STEEDS NODIG IS
 * 
 * Dit kleine bestand wordt gebruikt door MEERDERE pagina's:
 * ✅ index.js (homepage carousel data-counts)
 * ✅ alle-projecten.js (project count updates)  
 * ✅ alle-studenten.js (student count updates)
 * ✅ alle-bedrijven.js (company count updates)
 * ✅ organisator-homepage.js (admin dashboard counts)
 * 
 * Het is een SHARED UTILITY - herbruikbaar overal!
 */

// Utility om alle .data-count elementen bij te werken
export function updateDataCounts(stats = {}) {
    // stats: { studenten: 24, bedrijven: 18, projecten: 8, ... }
    console.log('📊 [stat-utils] Updating data counts:', stats);
    
    const dataCountElements = document.querySelectorAll('.data-count[data-type]');
    console.log(`📊 [stat-utils] Found ${dataCountElements.length} data-count elements`);
    
    dataCountElements.forEach(el => {
        const type = el.getAttribute('data-type');
        if (type && stats[type] !== undefined) {
            const oldValue = el.textContent;
            el.textContent = stats[type];
            console.log(`📊 [stat-utils] Updated ${type}: ${oldValue} → ${stats[type]}`);
            
            // Add visual feedback
            el.style.transition = 'all 0.3s ease';
            el.style.transform = 'scale(1.1)';
            el.style.color = '#881538';
            
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 300);
        }
    });
    
    console.log('✅ [stat-utils] Data counts updated successfully');
}

// Optional: Legacy support voor oude data-count format
export function updateLegacyDataCounts(stats = {}) {
    console.log('⚠️ [stat-utils] Updating legacy data-count format');
    
    // Oude format: <span data-count="25">0</span>
    const legacyElements = document.querySelectorAll('[data-count]:not([data-type])');
    
    legacyElements.forEach(el => {
        const dataCount = el.getAttribute('data-count');
        const context = el.closest('.section-title')?.textContent?.toLowerCase() || '';
        
        let type = 'unknown';
        if (context.includes('bedrijf')) type = 'bedrijven';
        else if (context.includes('student')) type = 'studenten'; 
        else if (context.includes('project')) type = 'projecten';
        
        if (type !== 'unknown' && stats[type] !== undefined) {
            el.textContent = stats[type];
            console.log(`📊 [stat-utils] Updated legacy ${type}: ${stats[type]}`);
        }
    });
}

// Export both functions
export default {
    updateDataCounts,
    updateLegacyDataCounts
};

console.log('✅ [stat-utils] Utility functions loaded and ready for use!');

/*
 * GEBRUIK VOORBEELDEN:
 * 
 * // In index.js:
 * import { updateDataCounts } from '/src/JS/UTILS/stat-utils.js';
 * updateDataCounts({ bedrijven: 5, studenten: 12, projecten: 8 });
 * 
 * // In alle-projecten.js:
 * if (window.updateDataCounts) {
 *     window.updateDataCounts({ projecten: uniqueProjects.length });
 * }
 * 
 * // In alle-studenten.js:
 * window.updateDataCounts({ studenten: filteredStudents.length });
 */