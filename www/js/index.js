document.addEventListener('deviceready', onDeviceReady, false);

let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');
let categories = [];
let incidents = [];
let currentPage = '';

const ROUTES = {
    login: 'login',
    signup: 'signup',
    home: 'home',
    addIncident: 'add-incident'
};

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    window.addEventListener('hashchange', handleHashRoute);
    const initialHash = getRouteFromHash();

    if (initialHash) {
        navigate(initialHash, { updateHash: false });
        return;
    }

    if (token) navigate(ROUTES.home);
    else navigate(ROUTES.login);
}

function getRouteFromHash() {
    return (window.location.hash || '').replace(/^#\/?/, '');
}

function requiresAuth(page) {
    return page === ROUTES.home || page === ROUTES.addIncident;
}

function navigate(page, options = {}) {
    const { updateHash = true } = options;

    if (!Object.values(ROUTES).includes(page)) {
        page = token ? ROUTES.home : ROUTES.login;
    }

    if (requiresAuth(page) && !token) page = ROUTES.login;
    if (!requiresAuth(page) && token && page === ROUTES.login) page = ROUTES.home;

    if (updateHash) {
        const nextHash = `#/${page}`;
        if (window.location.hash !== nextHash) {
            window.location.hash = nextHash;
            return;
        }
    }

    loadPage(page);
}

function handleHashRoute() {
    const page = getRouteFromHash();
    navigate(page, { updateHash: false });
}

function wirePageRouting() {
    document.querySelectorAll('[data-route]').forEach((element) => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            const nextRoute = element.getAttribute('data-route');
            if (nextRoute) navigate(nextRoute);
        });
    });
}

function setActiveNavState(page) {
    document.querySelectorAll('[data-route]').forEach((element) => {
        const isActive = element.getAttribute('data-route') === page;
        element.classList.toggle('is-active', isActive);
        if (element.hasAttribute('aria-current')) {
            element.setAttribute('aria-current', isActive ? 'page' : 'false');
        }
    });
}

function loadPage(page) {
    currentPage = page;

    const oldStyle = document.querySelector('link[data-page-style]');
    if (oldStyle) oldStyle.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${page}.css`;
    link.setAttribute('data-page-style', page);
    document.head.appendChild(link);

    const oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();

    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-state">Loading page…</div>';

    fetch(`${page}.html`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch ${page}.html (${res.status})`);
            return res.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            app.innerHTML = doc.body.innerHTML;

            wirePageRouting();
            setActiveNavState(page);

            const script = document.createElement('script');
            script.src = `js/${page}.js`;
            script.setAttribute('data-page', page);
            document.body.appendChild(script);
        })
        .catch(() => {
            app.innerHTML = '<div class="loading-state" role="alert">Could not load this page.</div>';
        });
}
