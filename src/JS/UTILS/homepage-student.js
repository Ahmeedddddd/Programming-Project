// src/JS/UTILS/homepage-student.js

import { fetchWithAuth } from '../api.js';
import { ReservatieService } from '../reservatieService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    // Dit zorgt ervoor dat services zoals ReservatieService beschikbaar zijn.
    // Een robuuster systeem zou via custom events werken, maar dit is een eenvoudige oplossing.
    setTimeout(initializeStudentHomepage, 200); 
});

/**
 * Initialiseert de student-specifieke functionaliteiten op de homepage.
 */
async function initializeStudentHomepage() {
    console.log(" Initializing student-specific homepage functions...");
    await loadUserInfo();
    await loadUpcomingMeetings();
    // De algemene kaarten (bedrijven, projecten) worden al door index.js geladen.
}

/**
 * Haalt de gebruikersinformatie op en toont een welkomstbericht.
 */
async function loadUserInfo() {
    try {
        const response = await fetchWithAuth('/api/user-info');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
            const namePlaceholder = document.getElementById('student-name-placeholder');
            if (namePlaceholder && result.data.voornaam) {
                namePlaceholder.textContent = result.data.voornaam;
            }
        } else {
            console.warn('User info not found in response:', result.message);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

/**
 * Haalt de aankomende gesprekken voor de student op en toont ze.
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('meetingsCardsContainer');
    const countElement = document.querySelector('[data-count="gesprekken"]');

    if (!container) {
        console.error('Meeting container (#meetingsCardsContainer) not found!');
        return;
    }

    container.innerHTML = `<div class="loading-cards"><p>🔄 Gesprekken laden...</p></div>`;

    try {
        const response = await fetchWithAuth('/api/reservaties/my');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success && result.data) {
            const reservations = result.data;
            if (countElement) {
                countElement.textContent = reservations.length;
            }

            if (reservations.length === 0) {
                container.innerHTML = `<div class="no-data"><p>Je hebt nog geen aankomende gesprekken.</p></div>`;
                return;
            }

            // Toon alleen de eerste 4 gesprekken
            const meetingsHtml = reservations.slice(0, 4).map(res => {
                const meetingTime = new Date(res.startTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="preview-card">
                        <div class="card-header">
                            <h3 class="card-title">${res.bedrijfNaam ?? 'Onbekend Bedrijf'}</h3>
                        </div>
                        <div class="card-description">
                            <p><strong>Tijd:</strong> ${meetingTime}</p>
                            <p><strong>Status:</strong> <span class="status-${res.status.toLowerCase()}">${res.status}</span></p>
                        </div>
                    </div>
                `;
            }).join('');
            container.innerHTML = meetingsHtml;

        } else {
            throw new Error(result.message || 'Kon gesprekken niet ophalen.');
        }
    } catch (error) {
        console.error('Failed to load upcoming meetings for student:', error);
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Kon je gesprekken niet laden. Probeer het later opnieuw.</div>`;
        if (countElement) {
            countElement.textContent = '0';
        }
    }
}
