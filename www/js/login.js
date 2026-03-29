// Login page specific functionality
function initLoginPage() {
    const loginForm = document.querySelector('[data-form="login"]');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    mockLogin(username, password)
    .then(data => {
        token = data.token;
        userId = data.user_id;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        showNotification('Login successful!', 'success');
        setTimeout(() => navigate('home'), 500);
    })
    .catch(err => {
        console.error('Login error:', err);
        showNotification(err.message || 'Login failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 20px;
        background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        border-radius: 6px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}