let photoData = null;

function initAddIncidentPage() {
    const addForm = document.querySelector('[data-form="add-incident"]');
    const takePhotoBtn = document.getElementById('take-photo');
    const backBtn = document.getElementById('back-btn');

    if (addForm) addForm.addEventListener('submit', handleAddIncident);
    if (takePhotoBtn) takePhotoBtn.addEventListener('click', handleTakePhoto);
    if (backBtn) backBtn.addEventListener('click', () => navigate('home'));

    loadCategoriesForForm();
}

async function loadCategoriesForForm() {
    const categorySelect = document.querySelector('[name="category"]');
    if (!categorySelect) return;

    try {
        categories = await fetchCategories();

        while (categorySelect.options.length > 1) categorySelect.remove(1);
        categories.forEach((cat) => {
            const option = document.createElement('option');
            option.value = String(cat.id);
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        showNotification(err.message || 'Failed to load categories', 'error');
    }
}

function handleTakePhoto() {
    if (!navigator.camera) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
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
            photoData = `data:image/jpeg;base64,${imageData}`;
            displayPhotoPreview();
            showNotification('Photo attached', 'success');
        },
        () => showNotification('Camera cancelled or failed', 'error'),
        {
            quality: 60,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            targetWidth: 1280,
            targetHeight: 1280,
            correctOrientation: true
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

    const title = form.title.value.trim();
    const category = form.category.value;
    const description = form.description.value.trim();

    if (!title || !category || !description) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    navigator.geolocation.getCurrentPosition(
        (pos) => submitIncident({ title, category, description, pos, submitBtn, originalText, form }),
        () => submitIncident({ title, category, description, pos: null, submitBtn, originalText, form }),
        { timeout: 10000, enableHighAccuracy: true }
    );
}

async function submitIncident({ title, category, description, pos, submitBtn, originalText, form }) {
    try {
        let featuredMediaId = 0;
        if (photoData) {
            const media = await uploadMediaFromDataUrl(photoData, `incident-${Date.now()}.jpg`);
            featuredMediaId = media.id;
        }

        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;

        const contentHtml = `
            <p>${escapeHtml(description)}</p>
            <p><strong>Geo:</strong> ${escapeHtml(getLocationMetaText(lat, lng))}</p>
            <p><strong>Latitude:</strong> ${typeof lat === 'number' ? lat : 'N/A'}</p>
            <p><strong>Longitude:</strong> ${typeof lng === 'number' ? lng : 'N/A'}</p>
        `;

        await createIncidentPost({
            title,
            content: contentHtml,
            status: 'publish',
            categories: [Number(category)],
            featured_media: featuredMediaId || undefined
        });

        showNotification('Incident submitted successfully', 'success');
        notifySubmission();
        form.reset();
        photoData = null;
        const preview = document.getElementById('photo-preview');
        if (preview) preview.style.display = 'none';
        setTimeout(() => navigate('home'), 450);
    } catch (err) {
        showNotification(err.message || 'Failed to submit incident', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function notifySubmission() {
    if (typeof cordova !== 'undefined' && cordova.plugins?.notification?.local) {
        cordova.plugins.notification.local.schedule({
            title: 'Incident Sent',
            text: 'Your report has been published.',
            foreground: true
        });
    }
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
    document.addEventListener('DOMContentLoaded', initAddIncidentPage);
} else {
    initAddIncidentPage();
}
