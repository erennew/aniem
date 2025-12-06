// Voting System with MongoDB Integration
let currentUser = null;
let userToken = null;
let userVotes = {};
let isAdmin = false;
let pendingVote = null;

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const authModal = document.getElementById('authModal');
const userPanel = document.getElementById('userPanel');
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');
const adminLink = document.getElementById('adminLink');
const progressBar = document.querySelector('.progress-bar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

// Initialize the application
async function init() {
    const token = localStorage.getItem('token');
    if (token) {
        await validateToken(token);
    } else {
        showAuthModal();
    }
    
    // Load user votes if logged in
    if (currentUser) {
        await loadUserVotes();
        updateProgress();
        updateCategoryStatus();
        updateVoteButtons();
    }
}

// Show authentication modal
function showAuthModal() {
    authModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Hide authentication modal
function hideAuthModal() {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Switch between login and register tabs
function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        loginTab.style.display = 'block';
        registerTab.style.display = 'none';
    } else {
        loginTab.style.display = 'none';
        registerTab.style.display = 'block';
    }
}

// User registration
async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const errorElement = document.getElementById('registerError');
    
    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Registration successful! Please login.', 'success');
            switchTab('login');
            errorElement.textContent = '';
        } else {
            errorElement.textContent = data.error;
        }
    } catch (error) {
        errorElement.textContent = 'Registration failed. Please try again.';
    }
}

// User login
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            userToken = data.token;
            isAdmin = data.isAdmin;
            
            // Save token to localStorage
            localStorage.setItem('token', userToken);
            
            // Decode token to get user info
            const payload = JSON.parse(atob(userToken.split('.')[1]));
            currentUser = {
                id: payload.userId,
                username: payload.username,
                isAdmin: payload.isAdmin
            };
            
            // Update UI
            usernameDisplay.textContent = currentUser.username;
            userInfo.style.display = 'flex';
            if (currentUser.isAdmin) {
                adminLink.style.display = 'inline-block';
            }
            
            hideAuthModal();
            showToast(`Welcome back, ${currentUser.username}!`, 'success');
            
            // Load user votes
            await loadUserVotes();
            updateProgress();
            updateCategoryStatus();
            updateVoteButtons();
            
            // Show user panel
            userPanel.style.display = 'block';
            
        } else {
            errorElement.textContent = data.error;
        }
    } catch (error) {
        errorElement.textContent = 'Login failed. Please try again.';
    }
}

// Validate JWT token
async function validateToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/my-votes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            userToken = token;
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = {
                id: payload.userId,
                username: payload.username,
                isAdmin: payload.isAdmin
            };
            isAdmin = payload.isAdmin;
            
            // Update UI
            usernameDisplay.textContent = currentUser.username;
            userInfo.style.display = 'flex';
            userPanel.style.display = 'block';
            if (currentUser.isAdmin) {
                adminLink.style.display = 'inline-block';
            }
            
            hideAuthModal();
        } else {
            localStorage.removeItem('token');
            showAuthModal();
        }
    } catch (error) {
        localStorage.removeItem('token');
        showAuthModal();
    }
}

// Load user's votes
async function loadUserVotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/my-votes`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.ok) {
            const votes = await response.json();
            userVotes = {};
            votes.forEach(vote => {
                userVotes[vote.category] = vote.selection;
            });
        }
    } catch (error) {
        console.error('Failed to load votes:', error);
    }
}

// Submit a vote
async function vote(selection, category) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    // Check if already voted in this category
    if (userVotes[category]) {
        showToast('You have already voted in this category!', 'error');
        return;
    }
    
    // Show confirmation modal
    pendingVote = { selection, category };
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.textContent = `Are you sure you want to vote for "${selection}" in "${category}"?`;
    confirmModal.style.display = 'flex';
}

// Confirm vote
async function confirmVote(confirmed) {
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'none';
    
    if (!confirmed || !pendingVote) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(pendingVote)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update local state
            userVotes[pendingVote.category] = pendingVote.selection;
            
            // Update UI
            updateProgress();
            updateCategoryStatus();
            updateVoteButtons();
            
            // Show success message
            showToast(`Voted for ${pendingVote.selection} successfully!`, 'success');
            
            // Auto-scroll to next category
            scrollToNextCategory(pendingVote.category);
            
        } else {
            showToast(data.error || 'Voting failed', 'error');
        }
    } catch (error) {
        showToast('Failed to submit vote. Please try again.', 'error');
    }
    
    pendingVote = null;
}

// Update progress bar
function updateProgress() {
    const categories = [
        'Best Anime of 2025',
        'Best Animation Studio',
        'Best Voice Actor of 2025',
        'Most Anticipated Anime of 2025'
    ];
    
    const votedCount = categories.filter(cat => userVotes[cat]).length;
    const totalCount = categories.length;
    const percentage = (votedCount / totalCount) * 100;
    
    // Update progress bar
    progressBar.style.setProperty('--progress-width', `${percentage}%`);
    progressText.textContent = `${votedCount}/${totalCount} Categories Voted`;
    progressPercent.textContent = `${Math.round(percentage)}%`;
    
    // Update stats in user panel
    document.getElementById('votedCount').textContent = votedCount;
    document.getElementById('pendingCount').textContent = totalCount - votedCount;
    document.getElementById('totalVotesCount').textContent = Object.keys(userVotes).length;
    
    // Update category sections opacity
    categories.forEach((cat, index) => {
        const section = document.getElementById(`category${index + 1}`);
        if (section) {
            section.classList.toggle('active', !userVotes[cat]);
        }
    });
}

// Update category status indicators
function updateCategoryStatus() {
    const categories = {
        'Best Anime of 2025': 'status1',
        'Best Animation Studio': 'status2',
        'Best Voice Actor of 2025': 'status3',
        'Most Anticipated Anime of 2025': 'status4'
    };
    
    for (const [category, statusId] of Object.entries(categories)) {
        const element = document.getElementById(statusId);
        if (element) {
            if (userVotes[category]) {
                element.textContent = 'Voted ✓';
                element.classList.add('voted');
            } else {
                element.textContent = 'Not Voted';
                element.classList.remove('voted');
            }
        }
    }
}

// Update vote buttons state
function updateVoteButtons() {
    const buttons = document.querySelectorAll('.vote-btn');
    buttons.forEach(button => {
        const anime = button.closest('[data-anime]')?.dataset.anime;
        const category = button.closest('.category-section')?.dataset.category;
        
        if (anime && category) {
            if (userVotes[category] === anime) {
                button.innerHTML = '<i class="fas fa-check-circle"></i> Voted';
                button.classList.add('voted');
                button.disabled = true;
            } else if (userVotes[category]) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-lock"></i> Category Voted';
            } else {
                button.innerHTML = '<i class="fas fa-vote-yea"></i> Vote Now';
                button.classList.remove('voted');
                button.disabled = false;
            }
        }
    });
}

// Auto-scroll to next category
function scrollToNextCategory(currentCategory) {
    const categories = [
        'Best Anime of 2025',
        'Best Animation Studio',
        'Best Voice Actor of 2025',
        'Most Anticipated Anime of 2025'
    ];
    
    const currentIndex = categories.indexOf(currentCategory);
    if (currentIndex < categories.length - 1) {
        const nextCategoryId = `category${currentIndex + 2}`;
        const nextElement = document.getElementById(nextCategoryId);
        
        if (nextElement) {
            setTimeout(() => {
                nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }
}

// Show user's voting results
async function showMyResults() {
    const resultsContainer = document.getElementById('myResults');
    
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/my-votes`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.ok) {
            const votes = await response.json();
            
            resultsContainer.innerHTML = votes.length > 0 
                ? votes.map(vote => `
                    <div class="result-card">
                        <div class="result-category">${vote.category}</div>
                        <div class="result-selection">${vote.selection}</div>
                        <div class="result-time">${new Date(vote.timestamp).toLocaleDateString()}</div>
                    </div>
                `).join('')
                : '<p class="no-results">You haven\'t voted yet. Start voting above!</p>';
            
            // Scroll to results
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        resultsContainer.innerHTML = '<p class="error">Failed to load results</p>';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    userToken = null;
    userVotes = {};
    isAdmin = false;
    
    // Reset UI
    userInfo.style.display = 'none';
    userPanel.style.display = 'none';
    adminLink.style.display = 'none';
    
    // Reset progress
    updateProgress();
    updateCategoryStatus();
    updateVoteButtons();
    
    // Show auth modal
    showAuthModal();
    
    showToast('Logged out successfully', 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Set color based on type
    if (type === 'success') {
        toast.style.background = 'var(--secondary)';
    } else if (type === 'error') {
        toast.style.background = 'var(--danger)';
    } else {
        toast.style.background = 'var(--primary)';
    }
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize the application when page loads
window.onload = init;
