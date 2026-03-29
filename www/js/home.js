// Home page specific functionality
let currentIncidents = [];

function initHomePage() {
    const categoryFilter = document.getElementById('category-filter');
    const fabButton = document.getElementById('add-incident-fab');
    const logoutBtn = document.getElementById('logout-btn');
    const closeDetails = document.querySelector('.close-details');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilterChange);
        loadCategories();
    }

    if (fabButton) {
        fabButton.addEventListener('click', () => loadPage('add-incident'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (closeDetails) {
        closeDetails.addEventListener('click', hideDetailsModal);
    }

    // Load incidents when page initializes
    loadIncidents();
}

function loadCategories() {
    mockGetCategories()
        .then(data => {
            categories = Array.isArray(data) ? data : [];
            const categoryFilter = document.getElementById('category-filter');
            
            if (categoryFilter) {
                // Clear existing options except the first one
                while (categoryFilter.options.length > 1) {
                    categoryFilter.remove(1);
                }
                
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categoryFilter.appendChild(option);
                });
            }
        })
        .catch(err => {
            console.error('Error loading categories:', err);
            showNotification('Failed to load categories', 'error');
        });
}

function loadIncidents() {
    const incidentsList = document.getElementById('incidents-list');
    
    if (!incidentsList) return;

    // Show loading state
    incidentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Loading incidents...</p>';

    mockGetIncidents()
        .then(data => {
            currentIncidents = Array.isArray(data) ? data : [];
            displayIncidents(currentIncidents);
        })
        .catch(err => {
            console.error('Error loading incidents:', err);
            incidentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Failed to load incidents</p>';
            showNotification('Failed to load incidents', 'error');
        });
}

function displayIncidents(incidents) {
    const incidentsList = document.getElementById('incidents-list');
    
    if (!incidentsList) return;

    if (!incidents || incidents.length === 0) {
        incidentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No incidents reported yet</p>';
        return;
    }

    incidentsList.innerHTML = '';
    
    incidents.forEach(incident => {
        const categoryName = getCategoryName(incident.categories && incident.categories[0] ? incident.categories[0] : null);
        const location = incident.meta && incident.meta.location ? incident.meta.location : 'Location not available';
        
        const div = document.createElement('div');
        div.className = 'incident';
        div.innerHTML = `
            <h3>${incident.title.rendered || 'Untitled'}</h3>
            <p>${incident.excerpt.rendered || incident.content.rendered || ''}</p>
            <div style="margin-top: 10px; font-size: 13px; color: #999;">
                <span>📍 ${location}</span>
                <span style="margin-left: 15px;">🏷️ ${categoryName}</span>
            </div>
        `;
        div.addEventListener('click', () => showIncidentDetails(incident));
        incidentsList.appendChild(div);
    });
}

function getCategoryName(id) {
    return getMockCategoryName(id);
}

function handleFilterChange(e) {
    const catId = e.target.value;
    
    if (catId) {
        const filtered = currentIncidents.filter(i => 
            i.categories && i.categories.includes(parseInt(catId))
        );
        displayIncidents(filtered);
    } else {
        displayIncidents(currentIncidents);
    }
}

function showIncidentDetails(incident) {
    const modal = document.getElementById('incident-details-modal');
    const detailsContent = document.getElementById('incident-details');
    
    if (!modal || !detailsContent) return;

    const imageHtml = incident._embedded && incident._embedded['wp:featuredmedia'] 
        ? `<img src="${incident._embedded['wp:featuredmedia'][0].source_url}" alt="Incident photo" style="max-width: 100%; margin: 15px 0; border-radius: 6px;">` 
        : '';

    detailsContent.innerHTML = `
        <h2>${incident.title.rendered || 'Incident Details'}</h2>
        <div style="margin: 15px 0; font-size: 14px; color: #666;">
            <p><strong>Category:</strong> ${getCategoryName(incident.categories && incident.categories[0])}</p>
            <p><strong>Location:</strong> ${incident.meta && incident.meta.location ? incident.meta.location : 'Not available'}</p>
            <p><strong>Date:</strong> ${new Date(incident.date).toLocaleString()}</p>
        </div>
        <div style="margin: 20px 0;">
            <h3>Description</h3>
            <p>${incident.content.rendered || 'No description'}</p>
        </div>
        ${imageHtml}
    `;
    
    modal.style.display = 'flex';
}

function hideDetailsModal() {
    const modal = document.getElementById('incident-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        token = null;
        userId = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => loadPage('login'), 500);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}