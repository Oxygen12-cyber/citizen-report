const APP_CONFIG = {
    WP_BASE_URL: localStorage.getItem('wpBaseUrl') || 'https://josh-blog.wasmer.app/',
    POSTS_PER_PAGE: 50,
    POLL_INTERVAL_MS: 30000,
    SERVICE_USER: {
        username: 'admin',
        appPassword: 'emCk VTT2 Z0JS 2Chn 1osC eaUH'
    }
};

function setWpBaseUrl(url) {
    APP_CONFIG.WP_BASE_URL = (url || '').replace(/\/$/, '');
    localStorage.setItem('wpBaseUrl', APP_CONFIG.WP_BASE_URL);
}

function getWpBaseUrl() {
    return APP_CONFIG.WP_BASE_URL;
}

function assertBaseUrl() {
    if (!APP_CONFIG.WP_BASE_URL) {
        throw new Error('WordPress base URL is not set yet. Add it in www/js/api.js (APP_CONFIG.WP_BASE_URL).');
    }
}

function getServiceAuthHeader() {
    const { username, appPassword } = APP_CONFIG.SERVICE_USER;
    const basic = btoa(`${username}:${appPassword}`);
    return `Basic ${basic}`;
}

async function rawRequest(path, options = {}) {
    assertBaseUrl();

    const headers = options.headers ? { ...options.headers } : {};
    if (!headers['Content-Type'] && !(options.body instanceof Blob)) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(`${getWpBaseUrl()}${path}`, {
        ...options,
        headers
    });
}

async function wpRequest(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};

    // Always use application password for requests
    headers.Authorization = getServiceAuthHeader();

    const res = await rawRequest(`/wp-json/wp/v2${path}`, {
        ...options,
        headers
    });

    if (!res.ok) {
        let errMsg = `WordPress request failed (${res.status})`;
        try {
            const errData = await res.json();
            errMsg = errData.message || errMsg;
        } catch (e) {
            // ignore
        }
        throw new Error(errMsg);
    }

    if (res.status === 204) return null;
    return res.json();
}


async function fetchCategories() {
    return wpRequest('/categories?per_page=100&hide_empty=false', { method: 'GET' });
}

async function fetchIncidents(params = {}) {
    const query = new URLSearchParams({
        per_page: String(APP_CONFIG.POSTS_PER_PAGE),
        orderby: 'date',
        order: 'desc',
        _embed: 'true',
        ...params
    });
    return wpRequest(`/posts?${query.toString()}`, { method: 'GET' });
}

async function fetchMediaById(id) {
    if (!id || id === 0) return null;
    try {
        const media = await wpRequest(`/media/${id}`, { method: 'GET' });
        return media?.source_url || null;
    } catch {
        return null;
    }
}

async function uploadMediaFromDataUrl(dataUrl, filename = 'incident.jpg') {
    const auth = getServiceAuthHeader();

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const mediaRes = await rawRequest('/wp-json/wp/v2/media', {
        method: 'POST',
        headers: {
            Authorization: auth,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': blob.type || 'image/jpeg'
        },
        body: blob
    });

    if (!mediaRes.ok) {
        let msg = `Media upload failed (${mediaRes.status})`;
        try {
            const err = await mediaRes.json();
            msg = err.message || msg;
        } catch (e) {
            // ignore
        }
        throw new Error(msg);
    }

    return mediaRes.json();
}

async function createIncidentPost(payload) {
    const res = await rawRequest('/wp-json/wp/v2/posts', {
        method: 'POST',
        headers: {
            Authorization: getServiceAuthHeader()
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        let errMsg = `WordPress request failed (${res.status})`;
        try {
            const errData = await res.json();
            errMsg = errData.message || errMsg;
        } catch (e) {
            // ignore
        }
        throw new Error(errMsg);
    }

    return res.json();
}

function getLocationMetaText(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return 'Location unavailable';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
