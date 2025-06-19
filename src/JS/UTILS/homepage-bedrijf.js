// Dit script is nu leeg omdat alle studenten standaard zichtbaar zijn in de HTML. 

// Laat alleen de eerste 8 studenten en 8 projecten zien op de homepage-bedrijf

document.addEventListener('DOMContentLoaded', () => {
    // Studenten
    const studentsGrid = document.getElementById('students-grid');
    if (studentsGrid) {
        const studentCards = studentsGrid.querySelectorAll('.item-card');
        studentCards.forEach((card, idx) => {
            if (idx >= 8) card.style.display = 'none';
        });
    }

    // Projecten
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        const projectCards = projectsGrid.querySelectorAll('.item-card');
        projectCards.forEach((card, idx) => {
            if (idx >= 8) card.style.display = 'none';
        });
    }
}); 