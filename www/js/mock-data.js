// Mock Data for Citizen Report App

const mockCategories = [
    { id: 1, name: 'Accident' },
    { id: 2, name: 'Fighting' },
    { id: 3, name: 'Rioting' },
    { id: 4, name: 'Theft' },
    { id: 5, name: 'Fire' },
    { id: 6, name: 'Other' }
];

const mockIncidents = [
    {
        id: 1,
        title: { rendered: 'Traffic Accident on Highway 101' },
        excerpt: { rendered: 'Major traffic congestion due to a 3-car collision on Highway 101 near the downtown exit.' },
        content: { rendered: 'A serious traffic accident involving 3 vehicles has occurred on Highway 101. Emergency services are on the scene. Traffic is heavily congested. Avoid the area if possible.' },
        categories: [1],
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7128, -74.0060' },
        featured_media: 1,
        author: 1,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Traffic+Accident' }
            ]
        }
    },
    {
        id: 2,
        title: { rendered: 'Street Fight in Downtown Area' },
        excerpt: { rendered: 'Physical altercation between two groups in downtown central plaza.' },
        content: { rendered: 'A heated argument escalated into a physical fight between two groups in the downtown central plaza. Security has been notified and is monitoring the situation. Multiple police units have been dispatched to the area.' },
        categories: [2],
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7580, -73.9855' },
        featured_media: 2,
        author: 2,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Street+Fight' }
            ]
        }
    },
    {
        id: 3,
        title: { rendered: 'Protest March - Heavy Police Presence' },
        excerpt: { rendered: 'Large gathering of protesters in main square resulting in traffic diversions.' },
        content: { rendered: 'A significant protest march has begun in the main square with approximately 500+ participants. Police presence is heavy; multiple units are on standby. Traffic diversions are in effect for the surrounding areas. The situation remains peaceful at this time.' },
        categories: [3],
        date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7489, -73.9680' },
        featured_media: 3,
        author: 3,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Protest+March' }
            ]
        }
    },
    {
        id: 4,
        title: { rendered: 'Store Robbery - Jewelry Shop' },
        excerpt: { rendered: 'Jewelry store on Main Street robbed by armed individuals.' },
        content: { rendered: 'A jewelry store on Main Street has been robbed by two armed individuals. The suspects escaped in a dark-colored vehicle. Police are searching the area and have cordoned off the crime scene. Anyone with information is urged to contact local authorities.' },
        categories: [4],
        date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7614, -73.9776' },
        featured_media: 4,
        author: 4,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Store+Robbery' }
            ]
        }
    },
    {
        id: 5,
        title: { rendered: 'Apartment Building Fire' },
        excerpt: { rendered: 'Multi-story apartment building caught fire on East 5th Avenue.' },
        content: { rendered: 'A five-story apartment building on East 5th Avenue is currently engulfed in flames. Fire department is actively fighting the blaze. All residents have been evacuated. Emergency medical services are on standby to assist any injured individuals.' },
        categories: [5],
        date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7505, -73.9934' },
        featured_media: 5,
        author: 5,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Building+Fire' }
            ]
        }
    },
    {
        id: 6,
        title: { rendered: 'Hit and Run Incident' },
        excerpt: { rendered: 'Vehicle hit parked car and fled the scene near Central Park.' },
        content: { rendered: 'A hit and run incident occurred near Central Park when a dark sedan struck a parked vehicle and fled the scene. The owner of the parked vehicle has filed a police report. Witnesses reported seeing the fleeing vehicle head toward the north exit.' },
        categories: [1],
        date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7829, -73.9654' },
        featured_media: 6,
        author: 1,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Hit+and+Run' }
            ]
        }
    },
    {
        id: 7,
        title: { rendered: 'Public Disturbance in Park' },
        excerpt: { rendered: 'Group of individuals creating noise and disturbance in Riverside Park.' },
        content: { rendered: 'A group of approximately 15-20 individuals have gathered in Riverside Park creating excessive noise and disturbance. Park rangers have been notified and are en route. The group appears to be gathered for an unauthorized event.' },
        categories: [6],
        date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7710, -73.9896' },
        featured_media: 7,
        author: 2,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Public+Disturbance' }
            ]
        }
    },
    {
        id: 8,
        title: { rendered: 'Vehicle Collision at Intersection' },
        excerpt: { rendered: 'Multiple vehicle collision at busy intersection during rush hour.' },
        content: { rendered: 'A serious multi-vehicle collision has occurred at the intersection of 5th and Broadway during evening rush hour. Emergency responders are on scene. Traffic is heavily backed up in all directions. Commuters are advised to use alternate routes.' },
        categories: [1],
        date: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        meta: { location: '40.7484, -74.0033' },
        featured_media: 8,
        author: 3,
        _embedded: {
            'wp:featuredmedia': [
                { source_url: 'https://via.placeholder.com/400x300?text=Vehicle+Collision' }
            ]
        }
    }
];

// Mock Authentication
const mockUsers = [
    { username: 'john', password: 'password123', id: 1, token: 'mock_token_john_12345' },
    { username: 'jane', password: 'password456', id: 2, token: 'mock_token_jane_67890' },
    { username: 'demo', password: 'demo', id: 3, token: 'mock_token_demo_11111' }
];

// Utility function to get category name by ID
function getMockCategoryName(id) {
    const category = mockCategories.find(cat => cat.id == id);
    return category ? category.name : 'Unknown';
}

// Mock API functions
function mockLogin(username, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.username === username && u.password === password);
            if (user) {
                resolve({
                    token: user.token,
                    user_id: user.id
                });
            } else {
                reject({
                    message: 'Invalid username or password'
                });
            }
        }, 500);
    });
}

function mockGetCategories() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockCategories);
        }, 300);
    });
}

function mockGetIncidents() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockIncidents);
        }, 500);
    });
}

function mockAddIncident(incident) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newIncident = {
                ...incident,
                id: mockIncidents.length + 1,
                date: new Date().toISOString(),
                author: userId,
                _embedded: {
                    'wp:featuredmedia': incident.featured_media ? [{ source_url: incident.featured_media }] : []
                }
            };
            mockIncidents.unshift(newIncident);
            resolve({
                id: newIncident.id,
                message: 'Incident created successfully'
            });
        }, 600);
    });
}

function mockGetIncidentsByAuthor(authorId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const userIncidents = mockIncidents.filter(incident => incident.author === authorId);
            resolve(userIncidents);
        }, 400);
    });
}