/**
 * 📊 stat-utils.js - ESSENTIEEL UTILITY BESTAND voor statistieken en data counts
 * 
 * Dit bestand beheert alle statistieken en tellers in de applicatie:
 * - Dynamische data counts voor verschillende secties
 * - Statistiek updates voor dashboards
 * - Backward compatibility voor oude implementaties
 * 
 * Belangrijke functionaliteiten:
 * - Automatische detectie van data-count elementen
 * - Flexibele statistiek mapping
 * - Legacy support voor oude code
 * - Real-time updates van tellers
 * - Multi-selector ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * 📈 Werkt alle data counts bij in de applicatie
 * 
 * Deze functie zoekt automatisch naar elementen met data-count attributen
 * en specifieke ID's en werkt deze bij met de geleverde statistieken.
 * 
 * Ondersteunde data types:
 * - bedrijven: Aantal bedrijven
 * - studenten: Aantal studenten  
 * - projecten: Aantal projecten
 * - gesprekken: Aantal gesprekken
 * - upcoming-meetings: Aankomende meetings
 * - pending-requests: Wachtende verzoeken
 * 
 * @param {Object} stats - Object met statistieken per type
 * @param {number} stats.bedrijven - Aantal bedrijven
 * @param {number} stats.studenten - Aantal studenten
 * @param {number} stats.projecten - Aantal projecten
 * @param {number} stats.gesprekken - Aantal gesprekken
 * @param {number} stats['upcoming-meetings'] - Aankomende meetings
 * @param {number} stats['pending-requests'] - Wachtende verzoeken
 * @returns {void}
 */
export function updateDataCounts(stats = {}) {
    // Zoek alle elementen met data-count attributen
    const dataCountElements = document.querySelectorAll('[data-count]');

    // Zoek ook naar specifieke ID patronen die counts kunnen bevatten
    const specificIdElements = [
        'total-companies-count',
        'total-students-count', 
        'total-projects-count',
        'upcoming-meetings-count',
        'upcoming-appointments-count',
        'pending-requests-count'
    ].map(id => document.getElementById(id)).filter(el => el);

    // Update data-count elementen
    dataCountElements.forEach(element => {
        const dataType = element.getAttribute('data-count');
        const count = stats[dataType];
        
        if (count !== undefined) {
            element.textContent = count;
        }
    });

    // Update specifieke ID elementen
    const idMappings = {
        'total-companies-count': stats.bedrijven,
        'total-students-count': stats.studenten,
        'total-projects-count': stats.projecten,
        'upcoming-meetings-count': stats['upcoming-meetings'],
        'upcoming-appointments-count': stats.gesprekken,
        'pending-requests-count': stats['pending-requests']
    };
    
    Object.entries(idMappings).forEach(([id, count]) => {
        if (count !== undefined) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        }
    });

    // Update ook elementen met overeenkomende tekstpatronen
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
                    // Potentieel count element gevonden
                }
            });
        }
    });
}

/**
 * 🔄 Legacy functie voor backward compatibility
 * 
 * Deze functie biedt ondersteuning voor oude implementaties
 * en roept de nieuwe updateDataCounts functie aan
 * 
 * @param {Object} stats - Object met statistieken
 * @returns {void}
 */
export function updateLegacyDataCounts(stats = {}) {
    // Zoek elementen op basis van veelvoorkomende patronen
    const selectors = [
        '[data-count]',
        '.count-badge',
        '.data-count',
        '#total-companies-count',
        '#total-students-count', 
        '#total-projects-count'
    ];

    // Update met de nieuwe methode
    updateDataCounts(stats);
}

// Export both functions
export default {
    updateDataCounts,
    updateLegacyDataCounts
};

// Maak functies globaal beschikbaar voor backward compatibility
window.updateDataCounts = updateDataCounts;
window.updateLegacyDataCounts = updateLegacyDataCounts;

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