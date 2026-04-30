document.addEventListener('deviceready', onDeviceReady, false);


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

    navigate(ROUTES.login);
}

function getRouteFromHash() {
    return (window.location.hash || '').replace(/^#\/?/, '');
}

function navigate(page, options = {}) {
    const { updateHash = true } = options;

    if (!Object.values(ROUTES).includes(page)) {
        page = ROUTES.login;
    }

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

            const existingScript = document.querySelector(`script[data-page="${page}"]`);
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = `js/${page}.js`;
                script.setAttribute('data-page', page);
                document.body.appendChild(script);
            } else {
                // Call init function if script already loaded
                const fnName = 'init' + page.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Page';
                if (typeof window[fnName] === 'function') {
                    window[fnName]();
                }
            }
        })
        .catch(() => {
            app.innerHTML = '<div class="loading-state" role="alert">Could not load this page.</div>';
        });
}
