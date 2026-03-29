// Wait for the deviceready event before using any of Cordova's device APIs.
document.addEventListener('deviceready', onDeviceReady, false);

const WP_BASE = 'https://your-wordpress-site.com/wp-json/wp/v2/';
const JWT_BASE = 'https://your-wordpress-site.com/wp-json/jwt-auth/v1/';

let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');
let categories = [];
let incidents = [];
let currentPage = '';

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // Load initial page based on authentication status
    if (token) {
        loadPage('home');
    } else {
        loadPage('login');
    }
}

function loadPage(page) {
    currentPage = page;
    
    // Remove old stylesheet
    const oldStyle = document.querySelector('link[rel="stylesheet"]');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    // Add new stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/' + page + '.css';
    document.head.appendChild(link);
    
    // Remove old page script
    const oldScript = document.querySelector('script[data-page]');
    if (oldScript) {
        oldScript.remove();
    }
    
    fetch(page + '.html')
    .then(res => res.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        document.getElementById('app').innerHTML = bodyContent;
        
        // Load page-specific script
        const script = document.createElement('script');
        script.src = 'js/' + page + '.js';
        script.setAttribute('data-page', page);
        script.onload = () => {
            console.log('Loaded ' + page + ' page script');
        };
        script.onerror = () => {
            console.error('Failed to load ' + page + ' page script');
        };
        document.body.appendChild(script);
    })
    .catch(err => {
        console.error('Error loading page:', err);
        alert('Failed to load page');
    });
}

function login(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    fetch(JWT_BASE + 'token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            token = data.token;
            userId = data.user_id;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            loadPage('home');
        } else {
            alert('Login failed');
        }
    })
    .catch(err => alert('Login error: ' + err));
}

function login(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    fetch(JWT_BASE + 'token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            token = data.token;
            userId = data.user_id;
            localStorage.setItem('userId', userId);
            loadPage('home');
        } else {
            alert('Login failed');
        }
    })
    .catch(err => alert('Login error: ' + err));
}

function loadCategories() {
    fetch(WP_BASE + 'categories')
    .then(res => res.json())
    .then(data => {
        categories = data;
        const select = document.querySelector('[name="category"]');
        const filter = document.getElementById('category-filter');
        data.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
            filter.appendChild(option.cloneNode(true));
        });
    });
}

function loadIncidents() {
    fetch(WP_BASE + 'posts?per_page=100')
    .then(res => res.json())
    .then(data => {
        incidents = data;
        displayIncidents(incidents);
    });
}

function displayIncidents(incidents) {
    const list = document.getElementById('incidents-list');
    list.innerHTML = '';
    incidents.forEach(incident => {
        const div = document.createElement('div');
        div.className = 'incident';
        div.innerHTML = `
            <h3>${incident.title.rendered}</h3>
            <p>${incident.excerpt.rendered}</p>
            <p>Category: ${getCategoryName(incident.categories[0])}</p>
            <p>Location: ${incident.meta ? incident.meta.location : 'N/A'}</p>
        `;
        div.addEventListener('click', () => showIncidentDetails(incident));
        list.appendChild(div);
    });
}

function getCategoryName(id) {
    const cat = categories.find(c => c.id == id);
    return cat ? cat.name : 'Unknown';
}

function filterIncidents() {
    const catId = document.getElementById('category-filter').value;
    if (catId) {
        const filtered = incidents.filter(i => i.categories.includes(parseInt(catId)));
        displayIncidents(filtered);
    } else {
        displayIncidents(incidents);
    }
}

function addIncident(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.category.value;
    const description = form.description.value;

    // Get location
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Upload photo if any
        let mediaId = null;
        if (photoData) {
            uploadMedia(photoData).then(id => {
                mediaId = id;
                createPost(category, description, lat, lng, mediaId);
            });
        } else {
            createPost(category, description, lat, lng, mediaId);
        }
    }, err => {
        alert('Location error: ' + err.message);
    });
}

function uploadMedia(data) {
    return fetch(WP_BASE + 'media', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'image/jpeg',
            'Content-Disposition': 'attachment; filename="incident.jpg"'
        },
        body: data
    })
    .then(res => res.json())
    .then(data => data.id);
}

function createPost(category, description, lat, lng, mediaId) {
    const post = {
        title: 'Incident Report',
        content: description,
        categories: [category],
        status: 'publish',
        meta: {
            location: `${lat}, ${lng}`,
            user_id: userId
        }
    };
    if (mediaId) {
        post.featured_media = mediaId;
    }

    fetch(WP_BASE + 'posts', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
    })
    .then(res => res.json())
    .then(data => {
        alert('Incident submitted');
        cordova.plugins.notification.local.schedule({
            title: 'Incident Submitted',
            text: 'Your incident has been reported.',
            foreground: true
        });
        loadPage('home');
        loadIncidents();
    })
    .catch(err => alert('Submit error: ' + err));
}

function takePhoto() {
    navigator.camera.getPicture(success => {
        photoData = 'data:image/jpeg;base64,' + success;
        document.getElementById('photo-preview').src = photoData;
        document.getElementById('photo-preview').style.display = 'block';
    }, err => {
        alert('Camera error: ' + err);
    }, {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL
    });
}

function loadMyIncidents() {
    fetch(WP_BASE + 'posts?author=' + userId)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('my-incidents-list');
        list.innerHTML = '';
        data.forEach(incident => {
            const div = document.createElement('div');
            div.className = 'incident';
            div.innerHTML = `
                <h3>${incident.title.rendered}</h3>
                <p>${incident.excerpt.rendered}</p>
            `;
            list.appendChild(div);
        });
    });
}

    const details = document.getElementById('incident-details');
    details.innerHTML = `
        <h2>${incident.title.rendered}</h2>
        <p>${incident.content.rendered}</p>
        <p>Location: ${incident.meta.location}</p>
        ${incident.featured_media ? `<img src="${incident._embedded['wp:featuredmedia'][0].source_url}" style="max-width:100%;">` : ''}
    `;
    document.getElementById('incident-details-modal').style.display = 'flex';

function hideDetailsModal() {
    document.getElementById('incident-details-modal').style.display = 'none';
}

function logout() {
    token = null;
    userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    loadPage('login');
}
