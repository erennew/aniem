// Admin Login Functions
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123' // In production, this should be in environment variables
};

// Initialize login page
function initLogin() {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token && isValidToken(token)) {
        redirectToAdmin();
        return;
    }
    
    // Clear any existing tokens
    localStorage.removeItem('adminToken');
    
    // Set up form submission
    const form = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // Allow login on Enter key
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Focus on username input
    usernameInput.focus();
}

// Handle login
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('errorMessage');
    
    // Clear previous errors
    errorElement.textContent = '';
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Create admin token (in production, this should come from server)
        const adminToken = generateAdminToken();
        
        // Store token
        localStorage.setItem('adminToken', adminToken);
        
        // Set expiry (24 hours)
        const expiry = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('adminTokenExpiry', expiry);
        
        // Show success message and redirect
        showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            redirectToAdmin();
        }, 1000);
        
    } else {
        showError('Invalid username or password');
        
        // Add shake animation
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'none';
        setTimeout(() => {
            loginCard.style.animation = 'shake 0.5s ease';
        }, 10);
        
        // Clear password field
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Generate admin token (simplified - in production use JWT)
function generateAdminToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${ADMIN_CREDENTIALS.username}:${timestamp}:${random}`).replace(/=/g, '');
}

// Validate token
function isValidToken(token) {
    try {
        const expiry = localStorage.getItem('adminTokenExpiry');
        if (!expiry || Date.now() > parseInt(expiry)) {
            return false;
        }
        
        // In production, this would validate JWT signature
        const decoded = atob(token);
        return decoded.startsWith(ADMIN_CREDENTIALS.username + ':');
    } catch (error) {
        return false;
    }
}

// Redirect to admin dashboard
function redirectToAdmin() {
    window.location.href = 'admin.html';
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    
    // Add animation
    errorElement.style.animation = 'fadeIn 0.3s ease';
}

// Show success message
function showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.color = '#10b981';
    
    // Add animation
    errorElement.style.animation = 'fadeIn 0.3s ease';
}

// Add shake animation for login errors
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize login when page loads
window.onload = initLogin;