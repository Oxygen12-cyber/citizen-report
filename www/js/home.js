let currentIncidents = [];
let pollTimer = null;
let lastSeenIncidentId = Number(localStorage.getItem('lastSeenIncidentId') || 0);

function initHomePage() {
    const categoryFilter = document.getElementById('category-filter');
    const mineOnly = document.getElementById('mine-only');
    const fabButton = document.getElementById('add-incident-fab');
    const logoutBtn = document.getElementById('logout-btn');
    const closeDetails = document.querySelector('.close-details');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadIncidents);
        loadCategories();
    }

    if (mineOnly) {
        mineOnly.addEventListener('change', loadIncidents);
    }

    if (fabButton) {
        fabButton.addEventListener('click', () => navigate('add-incident'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (closeDetails) {
        closeDetails.addEventListener('click', hideDetailsModal);
    }

    loadIncidents().then(startPollingForNewIncidents);
}

async function loadCategories() {
    try {
        categories = await fetchCategories();
        const categoryFilter = document.getElementById('category-filter');

        if (categoryFilter) {
            while (categoryFilter.options.length > 1) categoryFilter.remove(1);
            categories.forEach((cat) => {
                const option = document.createElement('option');
                option.value = String(cat.id);
                option.textContent = cat.name;
                categoryFilter.appendChild(option);
            });
        }
    } catch (err) {
        showNotification(err.message || 'Failed to load categories', 'error');
    }
}

async function loadIncidents() {
    const incidentsList = document.getElementById('incidents-list');
    const categoryId = document.getElementById('category-filter')?.value;
    const mineOnly = document.getElementById('mine-only')?.checked;

    if (!incidentsList) return;
    incidentsList.innerHTML = '<p style="text-align:center;color:#607089;padding:20px;">Loading incidents...</p>';

    try {
        const params = {};
        if (categoryId) params.categories = categoryId;
        if (mineOnly && userId) params.author = String(userId);

        currentIncidents = await fetchIncidents(params);

        if (currentIncidents.length > 0) {
            const newestId = Number(currentIncidents[0].id || 0);
            if (newestId > lastSeenIncidentId) {
                lastSeenIncidentId = newestId;
                localStorage.setItem('lastSeenIncidentId', String(lastSeenIncidentId));
            }
        }

        displayIncidents(currentIncidents);
    } catch (err) {
        incidentsList.innerHTML = '<p style="text-align:center;color:#607089;padding:20px;">Unable to load incidents.</p>';
        showNotification(err.message || 'Failed to load incidents', 'error');
    }
}

function displayIncidents(incidents) {
    const incidentsList = document.getElementById('incidents-list');
    if (!incidentsList) return;

    if (!incidents || incidents.length === 0) {
        incidentsList.innerHTML = '<p style="text-align:center;color:#607089;padding:20px;">No incidents yet.</p>';
        return;
    }

    incidentsList.innerHTML = '';
    incidents.forEach((incident) => {
        const div = document.createElement('div');
        div.className = 'incident';

        const categoryName = incident._embedded?.['wp:term']?.[0]?.[0]?.name || 'Uncategorized';
        const summary = stripHtml(incident.excerpt?.rendered || incident.content?.rendered || '');
        const authorName = incident._embedded?.author?.[0]?.name || 'Unknown reporter';

        div.innerHTML = `
            <h3>${escapeHtml(incident.title?.rendered || 'Untitled')}</h3>
            <p>${escapeHtml(summary)}</p>
            <div style="margin-top:10px;font-size:13px;color:#607089;display:flex;gap:12px;flex-wrap:wrap;">
                <span>${escapeHtml(categoryName)}</span>
                <span>By ${escapeHtml(authorName)}</span>
                <span>${new Date(incident.date).toLocaleString()}</span>
            </div>
        `;

        div.addEventListener('click', () => showIncidentDetails(incident));
        incidentsList.appendChild(div);
    });
}

function showIncidentDetails(incident) {
    const modal = document.getElementById('incident-details-modal');
    const detailsContent = document.getElementById('incident-details');
    if (!modal || !detailsContent) return;

    const imageUrl = incident._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const categoryName = incident._embedded?.['wp:term']?.[0]?.[0]?.name || 'Uncategorized';

    detailsContent.innerHTML = `
        <h2>${escapeHtml(incident.title?.rendered || 'Incident')}</h2>
        <p><strong>Category:</strong> ${escapeHtml(categoryName)}</p>
        <p><strong>Date:</strong> ${new Date(incident.date).toLocaleString()}</p>
        <div style="margin-top:12px;">${incident.content?.rendered || ''}</div>
        ${imageUrl ? `<img src="${imageUrl}" alt="Incident image" style="max-width:100%;margin-top:12px;border-radius:10px;"/>` : ''}
    `;

    modal.style.display = 'flex';
}

function hideDetailsModal() {
    const modal = document.getElementById('incident-details-modal');
    if (modal) modal.style.display = 'none';
}

function handleLogout() {
    clearInterval(pollTimer);
    pollTimer = null;
    clearAuthCredentials();
    token = null;
    userId = null;
    showNotification('Logged out', 'success');
    setTimeout(() => navigate('login'), 300);
}

function startPollingForNewIncidents() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
        try {
            const latest = await fetchIncidents({ per_page: 1 });
            if (!latest || latest.length === 0) return;

            const newestId = Number(latest[0].id || 0);
            if (newestId > lastSeenIncidentId) {
                lastSeenIncidentId = newestId;
                localStorage.setItem('lastSeenIncidentId', String(lastSeenIncidentId));
                showNotification('New incident reported', 'info');
                notifyNewIncidentLocal();
                loadIncidents();
            }
        } catch (err) {
            // silent poll fail
        }
    }, APP_CONFIG.POLL_INTERVAL_MS);
}

function notifyNewIncidentLocal() {
    if (typeof cordova !== 'undefined' && cordova.plugins?.notification?.local) {
        cordova.plugins.notification.local.schedule({
            title: 'Citizen Report Update',
            text: 'A new incident has been added.',
            foreground: true
        });
    }
}

function stripHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text || '';
    return (div.textContent || div.innerText || '').trim();
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 12px 16px; border-radius: 10px; z-index: 9999; color: #fff;
        background: ${type === 'error' ? '#c63d3d' : type === 'success' ? '#1a8e53' : '#145ac7'};
        box-shadow: 0 8px 20px rgba(0,0,0,0.15); font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity .25s ease';
        setTimeout(() => notification.remove(), 250);
    }, 2200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}
