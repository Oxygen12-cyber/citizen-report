let currentIncidents = [];
let pollTimer = null;
let lastSeenIncidentId = Number(localStorage.getItem('lastSeenIncidentId') || 0);


let touchStartY = 0;
let isPulling = false;
const PULL_THRESHOLD = 65;


function initHomePage() {
    const categoryFilter = document.getElementById('category-filter');
    const mineOnly       = document.getElementById('mine-only');
    const fabButton      = document.getElementById('add-incident-fab');
    const logoutBtn      = document.getElementById('logout-btn');

    const welcomeMsg    = document.getElementById('welcome-msg');
    const dummyUsername = localStorage.getItem('dummyUsername');
    if (welcomeMsg && dummyUsername) {
        welcomeMsg.textContent = `Hello ${dummyUsername}`;
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadIncidents);
        loadCategories();
    }

    if (mineOnly) {
        mineOnly.addEventListener('change', renderFilteredIncidents);
    }

    if (fabButton) {
        fabButton.addEventListener('click', () => navigate('add-incident'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    initPullToRefresh();
    loadIncidents().then(startPollingForNewIncidents);
}


function initPullToRefresh() {
    const list = document.getElementById('incidents-list');
    if (!list) return;

    // Ensure the PTR indicator exists
    let ptr = document.getElementById('ptr-indicator');
    if (!ptr) {
        ptr = document.createElement('div');
        ptr.id = 'ptr-indicator';
        ptr.className = 'ptr-indicator';
        ptr.innerHTML = `<span class="ptr-spinner"></span><span class="ptr-text">Release to refresh</span>`;
        list.parentElement.insertBefore(ptr, list);
    }

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        const delta = e.touches[0].clientY - touchStartY;
        if (delta > 10 && window.scrollY === 0) {
            ptr.classList.add('visible');
            ptr.style.height = Math.min(delta * 0.5, 60) + 'px';
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!isPulling) return;
        isPulling = false;
        const delta = e.changedTouches[0].clientY - touchStartY;
        ptr.style.height = '0';
        ptr.classList.remove('visible');
        if (delta > PULL_THRESHOLD) {
            loadIncidents();
        }
    }, { passive: true });
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
    const categoryId    = document.getElementById('category-filter')?.value;

    if (!incidentsList) return;

    showSkeletonLoader(incidentsList);

    try {
        const params = {};
        if (categoryId) params.categories = categoryId;

        currentIncidents = await fetchIncidents(params);

        if (currentIncidents.length > 0) {
            const newestId = Number(currentIncidents[0].id || 0);
            if (newestId > lastSeenIncidentId) {
                lastSeenIncidentId = newestId;
                localStorage.setItem('lastSeenIncidentId', String(lastSeenIncidentId));
            }
        }

        renderFilteredIncidents();
    } catch (err) {
        showErrorState(incidentsList);
        showNotification(err.message || 'Failed to load incidents', 'error');
    }
}


function showSkeletonLoader(container) {
    container.innerHTML = [1, 2, 3].map(() => `
        <div class="skeleton-card">
            <div class="skel skel-title"></div>
            <div class="skel skel-line"></div>
            <div class="skel skel-line short"></div>
            <div class="skel skel-meta"></div>
        </div>
    `).join('');
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#d1d9e0" stroke-width="2.5">
                <circle cx="32" cy="32" r="28"/>
                <line x1="32" y1="20" x2="32" y2="36"/>
                <circle cx="32" cy="44" r="1.5" fill="#d1d9e0" stroke="none"/>
            </svg>
            <p class="empty-title">Could not load feed</p>
            <p class="empty-sub">Check your connection and try again.</p>
            <button onclick="loadIncidents()" class="empty-retry">Retry</button>
        </div>
    `;
}


function extractDummyAuthor(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    const el = div.querySelector('[data-dummy-author]');
    return el ? el.getAttribute('data-dummy-author') : null;
}

function renderFilteredIncidents() {
    const mineOnly      = document.getElementById('mine-only')?.checked;
    const dummyUsername = localStorage.getItem('dummyUsername');

    let filtered = currentIncidents;

    if (mineOnly && dummyUsername) {
        filtered = currentIncidents.filter(incident => {
            const author = extractDummyAuthor(incident.content?.rendered);
            return author === dummyUsername;
        });
    }

    displayIncidents(filtered);
}

function displayIncidents(incidents) {
    const incidentsList = document.getElementById('incidents-list');
    if (!incidentsList) return;

    if (!incidents || incidents.length === 0) {
        const mineOnly      = document.getElementById('mine-only')?.checked;
        const dummyUsername = localStorage.getItem('dummyUsername');

        if (mineOnly && dummyUsername) {
            incidentsList.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#d1d9e0" stroke-width="2.5">
                        <rect x="12" y="8" width="40" height="48" rx="5"/>
                        <line x1="20" y1="24" x2="44" y2="24"/>
                        <line x1="20" y1="32" x2="44" y2="32"/>
                        <line x1="20" y1="40" x2="34" y2="40"/>
                    </svg>
                    <p class="empty-title">No reports yet</p>
                    <p class="empty-sub">You haven't submitted any incidents as <strong>${escapeHtml(dummyUsername)}</strong>.</p>
                </div>`;
        } else {
            incidentsList.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#d1d9e0" stroke-width="2.5">
                        <circle cx="32" cy="28" r="14"/>
                        <path d="M32 42 L32 56"/>
                        <circle cx="32" cy="58" r="2" fill="#d1d9e0" stroke="none"/>
                        <line x1="20" y1="56" x2="44" y2="56"/>
                    </svg>
                    <p class="empty-title">No incidents reported</p>
                    <p class="empty-sub">Be the first to report an incident in your area.</p>
                </div>`;
        }
        return;
    }

    incidentsList.innerHTML = '';
    incidents.forEach((incident) => {
        const div = document.createElement('div');
        div.className = 'incident';

        const catId = incident.categories?.[0];
        const catObj = (typeof categories !== 'undefined' ? categories : []).find(c => c.id === catId);
        const categoryName = catObj?.name || 'Uncategorized';
        const summary      = stripHtml(incident.excerpt?.rendered || incident.content?.rendered || '').slice(0, 120);
        const dummyAuthor  = extractDummyAuthor(incident.content?.rendered);
        const authorName   = dummyAuthor || 'Unknown';
        const imageUrl     = incident._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
        const timeAgo      = formatTimeAgo(incident.date);

        div.innerHTML = `
            <h3>${escapeHtml(incident.title?.rendered || 'Untitled')}</h3>
            ${imageUrl ? `<img class="incident-thumb" src="${imageUrl}" alt="Incident image"/>` : ''}
            <p>${escapeHtml(summary)}${summary.length >= 120 ? '…' : ''}</p>
            <div class="incident-meta">
                <span class="meta-tag">${escapeHtml(categoryName)}</span>
                <span>By ${escapeHtml(authorName)}</span>
                <span>${timeAgo}</span>
            </div>
        `;

        div.addEventListener('click', () => showIncidentDetails(incident));
        incidentsList.appendChild(div);
    });
}


async function showIncidentDetails(incident) {
    const modal          = document.getElementById('incident-details-modal');
    const detailsContent = document.getElementById('incident-details');
    if (!modal || !detailsContent) return;

    const catId        = incident.categories?.[0];
    const catObj       = (typeof categories !== 'undefined' ? categories : []).find(c => c.id === catId);
    const categoryName = catObj?.name || 'Uncategorized';
    const dummyAuthor  = extractDummyAuthor(incident.content?.rendered);
    const authorName   = dummyAuthor || 'Unknown reporter';
    const timeAgo      = formatTimeAgo(incident.date);
    const hasImage     = incident.featured_media && incident.featured_media > 0;

    // Strip hidden author div from displayed content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = incident.content?.rendered || '';
    tempDiv.querySelectorAll('[data-dummy-author]').forEach(el => el.remove());

    // Extract lat/lng — support both old "Latitude:"/"Longitude:" and short "Lat:"/"Long:" labels
    const lat = extractCoord(tempDiv, 'Lat') ?? extractCoord(tempDiv, 'Latitude');
    const lng = extractCoord(tempDiv, 'Long') ?? extractCoord(tempDiv, 'Longitude');
    const cleanContent = tempDiv.innerHTML;


    detailsContent.innerHTML = `
        <span class="close-details" role="button" aria-label="Close">&times;</span>
        <h2 class="detail-title">${escapeHtml(incident.title?.rendered || 'Incident')}</h2>
        ${hasImage ? `
        <div class="detail-img-card" id="detail-img-wrap">
            <div class="detail-img-skeleton"><span class="ptr-spinner"></span></div>
        </div>` : ''}
        <div class="detail-meta">
            <span class="detail-pill">${escapeHtml(categoryName)}</span>
            <span class="detail-pill">By ${escapeHtml(authorName)}</span>
            <span class="detail-pill">${timeAgo}</span>
        </div>
        <div class="detail-body">${cleanContent}</div>
        ${lat !== null && lng !== null ? `
        <div class="detail-location">
            <span class="location-icon">📍</span>
            <span id="detail-location-text">Locating…</span>
        </div>` : ''}
    `;

    detailsContent.querySelector('.close-details')?.addEventListener('click', hideDetailsModal);
    modal.style.display = 'flex';

    // Fetch image and location in parallel
    const tasks = [];

    if (hasImage) {
        tasks.push(
            fetchMediaById(incident.featured_media).then(url => {
                const wrap = document.getElementById('detail-img-wrap');
                if (!wrap) return;
                if (url) {
                    wrap.innerHTML = `<img class="detail-img" src="${url}" alt="Incident photo"/>`;
                } else {
                    wrap.remove();
                }
            })
        );
    }

    if (lat !== null && lng !== null) {
        tasks.push(
            reverseGeocode(lat, lng).then(place => {
                const el = document.getElementById('detail-location-text');
                if (el) el.textContent = place;
            })
        );
    }

    await Promise.allSettled(tasks);
}

function extractCoord(domEl, label) {
    // Search all elements for the label text (supports p, span, div, etc.)
    const all = domEl.querySelectorAll('p, span, div');
    for (const el of all) {
        const text = el.childNodes.length === 1 || el.children.length <= 1
            ? el.textContent.trim()
            : '';
        if (text.startsWith(`${label}:`)) {
            const val = parseFloat(text.replace(`${label}:`, '').trim());
            if (!isNaN(val)) return val;
        }
    }
    return null;
}

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) return `${lat}, ${lng}`;
        const data = await res.json();
        const a = data.address || {};
        // Build a short, human-readable string from the most useful fields
        const parts = [
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.country
        ].filter(Boolean);
        return parts.length ? parts.join(', ') : data.display_name || `${lat}, ${lng}`;
    } catch {
        return `${lat}, ${lng}`;
    }
}

function hideDetailsModal() {
    const modal = document.getElementById('incident-details-modal');
    if (modal) modal.style.display = 'none';
}


function formatTimeAgo(dateStr) {
    const now  = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60)             return 'just now';
    if (diff < 3600)           return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)          return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7)      return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 86400 * 30)     return `${Math.floor(diff / (86400 * 7))}w ago`;
    if (diff < 86400 * 365)    return `${Math.floor(diff / (86400 * 30))}mo ago`;
    return `${Math.floor(diff / (86400 * 365))}y ago`;
}


function handleLogout() {
    clearInterval(pollTimer);
    pollTimer = null;
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
        padding: 10px 16px; border-radius: 6px; z-index: 9999; color: #fff;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
        font-weight: 600; font-size: 0.88rem; font-family: inherit;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity .25s ease';
        setTimeout(() => notification.remove(), 250);
    }, 2400);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}
