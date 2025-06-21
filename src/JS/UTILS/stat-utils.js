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

console.log("📊 [stat-utils] Loading stat-utils.js...");

/**
 * Updates data counts on the page by finding elements with data-count attributes
 * and updating their content with the provided statistics.
 * 
 * @param {Object} stats - Object containing count data (e.g., {bedrijven: 10, studenten: 20})
 */
export function updateDataCounts(stats = {}) {
    console.log("📊 [stat-utils] === UPDATING DATA COUNTS ===");
    console.log("📊 [stat-utils] Received stats:", stats);
    
    if (!stats || Object.keys(stats).length === 0) {
        console.warn("📊 [stat-utils] No stats provided, skipping update");
        return;
    }

    // Find all elements with data-count attributes
    const dataCountElements = document.querySelectorAll('[data-count]');
    console.log(`📊 [stat-utils] Found ${dataCountElements.length} data-count elements:`, 
        Array.from(dataCountElements).map(el => ({
            id: el.id,
            className: el.className,
            currentText: el.textContent,
            dataCount: el.getAttribute('data-count')
        }))
    );

    // Also look for specific ID patterns that might contain counts
    const specificElements = [
        'total-companies-count',
        'total-students-count', 
        'total-projects-count',
        'upcoming-meetings-count',
        'upcoming-appointments-count',
        'pending-requests-count'
    ];

    console.log("📊 [stat-utils] Looking for specific count elements...");
    specificElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`📊 [stat-utils] Found specific element #${id}:`, element);
        }
    });

    // Update data-count elements
    dataCountElements.forEach(element => {
        const dataType = element.getAttribute('data-count');
        const count = stats[dataType];
        
        if (count !== undefined) {
            console.log(`📊 [stat-utils] Updating ${dataType}: ${count} in element:`, element);
            element.textContent = count;
        } else {
            console.warn(`📊 [stat-utils] No count found for data-type: ${dataType}`);
        }
    });

    // Update specific ID elements
    const idMappings = {
        'total-companies-count': stats.bedrijven,
        'total-students-count': stats.studenten,
        'total-projects-count': stats.projecten,
        'upcoming-meetings-count': stats['upcoming-meetings'],
        'upcoming-appointments-count': stats.gesprekken,
        'pending-requests-count': stats['pending-requests']
    };

    console.log("📊 [stat-utils] Updating specific ID elements with mappings:", idMappings);
    
    Object.entries(idMappings).forEach(([id, count]) => {
        if (count !== undefined) {
            const element = document.getElementById(id);
            if (element) {
                console.log(`📊 [stat-utils] Updating #${id} with count: ${count}`);
                element.textContent = count;
            } else {
                console.warn(`📊 [stat-utils] Element #${id} not found`);
            }
        }
    });

    // Also update any elements with matching text patterns
    console.log("📊 [stat-utils] Looking for elements with count patterns...");
    const allElements = document.querySelectorAll('*');
    const countPatterns = [
        { pattern: /bedrijven/i, key: 'bedrijven' },
        { pattern: /studenten/i, key: 'studenten' },
        { pattern: /projecten/i, key: 'projecten' },
        { pattern: /gesprekken/i, key: 'gesprekken' }
    ];

    countPatterns.forEach(({ pattern, key }) => {
        const count = stats[key];
        if (count !== undefined) {
            allElements.forEach(element => {
                if (element.textContent && pattern.test(element.textContent) && 
                    element.textContent.match(/\d+/) && 
                    !element.hasAttribute('data-count')) {
                    console.log(`📊 [stat-utils] Potential count element found for ${key}:`, element);
                }
            });
        }
    });

    console.log("📊 [stat-utils] === DATA COUNTS UPDATE COMPLETE ===");
}

/**
 * Legacy function for backward compatibility
 * Updates data counts using the old method
 */
export function updateLegacyDataCounts(stats = {}) {
    console.log("📊 [stat-utils] Updating legacy data counts:", stats);
    
    // Find elements by common patterns
    const selectors = [
        '[data-count]',
        '.count-badge',
        '.data-count',
        '#total-companies-count',
        '#total-students-count', 
        '#total-projects-count'
    ];

    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`📊 [stat-utils] Found ${elements.length} elements for selector: ${selector}`);
    });

    // Update using the new method
    updateDataCounts(stats);
}

// Export both functions
export default {
    updateDataCounts,
    updateLegacyDataCounts
};

console.log("✅ [stat-utils] Utility functions loaded and ready for use!");

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