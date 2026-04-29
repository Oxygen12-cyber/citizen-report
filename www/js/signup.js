function initSignupPage() {
    const signupForm = document.querySelector('[data-form="signup"]');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
}

async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
        name: form.name.value.trim(),
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value.trim()
    };

    if (!payload.name || !payload.username || !payload.email || !payload.password) {
        showNotification('Please complete all fields', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        await signupWordPressUser(payload);
        showNotification('Signup successful. Please login.', 'success');
        setTimeout(() => navigate('login'), 500);
    } catch (err) {
        showNotification(err.message || 'Signup failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 16px;
        background-color: ${type === 'error' ? '#c63d3d' : type === 'success' ? '#1a8e53' : '#145ac7'};
        color: white;
        border-radius: 10px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2400);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignupPage);
} else {
    initSignupPage();
}
