// Auth check function
function checkAuth() {
    const isLoggedIn = localStorage.getItem('smartlock_auth');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Role check function
function checkRole() {
    const currentPath = window.location.pathname;
    const userRole = localStorage.getItem('smartlock_role');

    // If user is not admin, restrict access to management pages
    if (userRole !== 'admin') {
        if (currentPath.includes('user.html') || 
            currentPath.includes('logs.html') || 
            currentPath.includes('admin.html')) {
            window.location.href = 'dashboard.html';
            return false;
        }
    }
    return true;
}

// Update navigation based on role
function updateNavigation() {
    const userRole = localStorage.getItem('smartlock_role');
    const managementLinks = document.querySelectorAll('a[href="user.html"], a[href="logs.html"], a[href="admin.html"]');
    
    managementLinks.forEach(link => {
        if (userRole !== 'admin') {
            link.parentElement.style.display = 'none';
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('smartlock_auth');
    localStorage.removeItem('smartlock_role');
    if (!localStorage.getItem('smartlock_remember')) {
        localStorage.removeItem('smartlock_user');
    }
    window.location.href = 'index.html';
}

// Check auth and role on page load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        checkRole();
        updateNavigation();
    }
});

// Add logout functionality to logout buttons
document.querySelectorAll('[data-logout]').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
});

// Update UI with username if available
const username = localStorage.getItem('smartlock_user');
if (username) {
    document.querySelectorAll('[data-username]').forEach(element => {
        element.textContent = username;
    });
}

// Update UI based on role
const userRole = localStorage.getItem('smartlock_role');
if (userRole === 'user') {
    // Hide management sections in dashboard if they exist
    const managementSections = document.querySelectorAll('[data-admin-only]');
    managementSections.forEach(section => {
        section.style.display = 'none';
    });
}
