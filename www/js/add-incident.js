// Add Incident page specific functionality
let photoData = null;

function initAddIncidentPage() {
    const addForm = document.querySelector('[data-form="add-incident"]');
    const takePhotoBtn = document.getElementById('take-photo');
    const backBtn = document.getElementById('back-btn');

    if (addForm) {
        addForm.addEventListener('submit', handleAddIncident);
    }

    if (takePhotoBtn) {
        takePhotoBtn.addEventListener('click', handleTakePhoto);
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (photoData && confirm('You have an unsaved photo. Discard it?')) {
                photoData = null;
                loadPage('home');
            } else if (!photoData) {
                loadPage('home');
            }
        });
    }

    // Load categories for the form
    loadCategoriesForForm();
}

function loadCategoriesForForm() {
    mockGetCategories()
        .then(data => {
            categories = Array.isArray(data) ? data : [];
            const categorySelect = document.querySelector('[name="category"]');
            
            if (categorySelect) {
                // Keep the default option
                const defaultOption = categorySelect.firstChild;
                categorySelect.innerHTML = '';
                categorySelect.appendChild(defaultOption);
                
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(err => {
            console.error('Error loading categories:', err);
            showNotification('Failed to load categories', 'error');
        });
}

function handleTakePhoto() {
    if (!navigator.camera) {
        console.warn('Camera plugin not available. Using file input fallback.');
        // Fallback for development/testing
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                photoData = event.target.result;
                displayPhotoPreview();
            };
            reader.readAsDataURL(file);
        };
        input.click();
        return;
    }

    navigator.camera.getPicture(
        (imageData) => {
            photoData = 'data:image/jpeg;base64,' + imageData;
            displayPhotoPreview();
            showNotification('Photo captured', 'success');
        },
        (message) => {
            console.error('Camera error:', message);
            showNotification('Failed to capture photo', 'error');
        },
        {
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            targetWidth: 400,
            targetHeight: 400
        }
    );
}

function displayPhotoPreview() {
    const preview = document.getElementById('photo-preview');
    if (preview && photoData) {
        preview.src = photoData;
        preview.style.display = 'block';
    }
}

function handleAddIncident(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.category.value;
    const description = form.description.value.trim();

    if (!category || !description) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get location
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            submitIncident(category, description, lat, lng, submitBtn, originalText, form);
        },
        (err) => {
            console.warn('Geolocation error:', err.message);
            // Continue without location
            submitIncident(category, description, null, null, submitBtn, originalText, form);
        },
        { timeout: 5000, enableHighAccuracy: false }
    );
}

function submitIncident(category, description, lat, lng, submitBtn, originalText, form) {
    const location = lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Location not available';
    
    const incident = {
        title: { rendered: 'Incident Report' },
        excerpt: { rendered: description.substring(0, 100) },
        content: { rendered: description },
        categories: [parseInt(category)],
        status: 'publish',
        meta: { location: location },
        featured_media: photoData || null
    };

    mockAddIncident(incident)
        .then(data => {
            showNotification('Incident submitted successfully!', 'success');
            if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.notification) {
                cordova.plugins.notification.local.schedule({
                    title: 'Incident Submitted',
                    text: 'Your incident has been reported.',
                    foreground: true
                });
            }
            photoData = null;
            form.reset();
            const preview = document.getElementById('photo-preview');
            if (preview) preview.style.display = 'none';
            setTimeout(() => loadPage('home'), 1000);
        })
        .catch(err => {
            console.error('Submit error:', err);
            showNotification('Failed to submit incident: ' + err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAddIncidentPage);
} else {
    initAddIncidentPage();
}