const APP_CONFIG = {
    // Set this later when your WordPress server is ready
    // Example: https://your-domain.com
    WP_BASE_URL: localStorage.getItem('wpBaseUrl') || 'https://josh-blog.wasmer.app/',
    POSTS_PER_PAGE: 50,
    POLL_INTERVAL_MS: 30000,
    ENDPOINTS: {
        JWT_LOGIN: '/wp-json/jwt-auth/v1/token',
        SIGNUP: '/wp-json/wp/v2/users/register'
    },
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

function getAuthHeader() {
    const authToken = localStorage.getItem('token');
    return authToken ? `Bearer ${authToken}` : null;
}

function getServiceAuthHeader() {
    const { username, appPassword } = APP_CONFIG.SERVICE_USER;
    const basic = btoa(`${username}:${appPassword}`);
    return `Basic ${basic}`;
}

function clearAuthCredentials() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('wpUsername');
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

async function wpRequest(path, options = {}, requireAuth = false) {
    const headers = options.headers ? { ...options.headers } : {};

    if (requireAuth) {
        const auth = getAuthHeader();
        if (!auth) throw new Error('Please log in first.');
        headers.Authorization = auth;
    }

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

async function loginWithWordPressPassword(username, password) {
    const res = await rawRequest(APP_CONFIG.ENDPOINTS.JWT_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data.message || msg;
        } catch (e) {
            // ignore
        }
        throw new Error(msg);
    }

    const data = await res.json();
    if (!data.token) {
        throw new Error('No auth token returned. Ensure JWT Auth plugin is active on WordPress.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', String(data.user_id || ''));
    localStorage.setItem('wpUsername', username);

    return {
        id: data.user_id,
        name: data.user_display_name || username,
        email: data.user_email || ''
    };
}

async function signupWordPressUser({ username, email, password, name }) {
    const res = await rawRequest(APP_CONFIG.ENDPOINTS.SIGNUP, {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name })
    });

    if (!res.ok) {
        let msg = `Signup failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data.message || msg;
        } catch (e) {
            // ignore
        }
        throw new Error(msg);
    }

    return res.json();
}

async function fetchCategories() {
    return wpRequest('/categories?per_page=100&hide_empty=false', { method: 'GET' }, false);
}

async function fetchIncidents(params = {}) {
    const query = new URLSearchParams({
        per_page: String(APP_CONFIG.POSTS_PER_PAGE),
        _embed: 'true',
        orderby: 'date',
        order: 'desc',
        ...params
    });
    return wpRequest(`/posts?${query.toString()}`, { method: 'GET' }, false);
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
