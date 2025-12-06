// Global variables
let userVotes = {
    'Best Anime of 2025': null,
    'Best Animation Studio': null,
    'Best Voice Actor of 2025': null,
    'Most Anticipated Anime of 2025': null
};
let currentVote = null;
let userName = null;

// Initialize the application
async function initApp() {
    try {
        // Generate guest username
        generateGuestName();
        
        // Show user panel
        showUserPanel();
        
        // Check voting status for each category
        await checkAllVotingStatus();
        
        // Update progress
        updateProgress();
        
        // Load live results
        await loadLiveResults();
        
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error loading voting data', 'error');
    }
}

// Generate guest username
function generateGuestName() {
    if (!userName) {
        const adjectives = ['Anime', 'Otaku', 'Weeb', 'Manga', 'Kawaii', 'Senpai'];
        const nouns = ['Lover', 'Fan', 'Master', 'Warrior', 'Ninja', 'Explorer'];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        userName = `${randomAdj}${randomNoun}${Math.floor(Math.random() * 999)}`;
        
        // Display username
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = `Guest: ${userName}`;
        }
        
        // Store in localStorage
        localStorage.setItem('userName', userName);
    }
}

// Show user panel
function showUserPanel() {
    const userPanel = document.getElementById('userPanel');
    const userInfo = document.getElementById('userInfo');
    
    if (userPanel) {
        userPanel.style.display = 'block';
    }
    
    if (userInfo) {
        userInfo.style.display = 'flex';
    }
}

// Check voting status for all categories
async function checkAllVotingStatus() {
    const categories = Object.keys(userVotes);
    
    for (const category of categories) {
        await checkVotingStatus(category);
    }
}

// Check if user has voted in a category
async function checkVotingStatus(category) {
    try {
        const response = await fetch('/api/check-vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.hasVoted) {
                // User has already voted in this category
                userVotes[category] = data.existingVote.selection;
                updateCategoryStatus(category, data.existingVote.selection);
            } else {
                // User can vote
                userVotes[category] = null;
            }
        }
    } catch (error) {
        console.error('Error checking voting status:', error);
    }
}

// Handle voting
function vote(selection, category) {
    currentVote = { selection, category };
    
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    if (modal && message) {
        message.textContent = `Are you sure you want to vote for "${selection}" in "${category}"?`;
        modal.style.display = 'flex';
    }
}

// Confirm vote
async function confirmVote(confirmed) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (!confirmed || !currentVote) return;
    
    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: currentVote.category,
                selection: currentVote.selection,
                userName: userName
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Vote successful
            userVotes[currentVote.category] = currentVote.selection;
            
            // Update UI
            updateCategoryStatus(currentVote.category, currentVote.selection);
            updateProgress();
            await loadLiveResults();
            
            // Show success message
            showToast(`Successfully voted for ${currentVote.selection}!`, 'success');
            
        } else {
            // Show error
            showToast(data.error || 'Failed to submit vote', 'error');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showToast('Network error. Please try again.', 'error');
    }
    
    currentVote = null;
}

// Update category status in UI
function updateCategoryStatus(category, selection) {
    const categoryMap = {
        'Best Anime of 2025': { statusId: 'status1', categoryId: 'category1' },
        'Best Animation Studio': { statusId: 'status2', categoryId: 'category2' },
        'Best Voice Actor of 2025': { statusId: 'status3', categoryId: 'category3' },
        'Most Anticipated Anime of 2025': { statusId: 'status4', categoryId: 'category4' }
    };
    
    const mapping = categoryMap[category];
    if (!mapping) return;
    
    const statusElement = document.getElementById(mapping.statusId);
    const categoryElement = document.getElementById(mapping.categoryId);
    
    if (statusElement) {
        statusElement.textContent = `Voted: ${selection}`;
        statusElement.className = 'category-status voted';
    }
    
    // Disable vote buttons in this category
    if (categoryElement) {
        const voteButtons = categoryElement.querySelectorAll('.vote-btn');
        voteButtons.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Already Voted';
            btn.classList.add('disabled');
        });
    }
}

// Update progress bar and stats
function updateProgress() {
    const categories = Object.keys(userVotes);
    const votedCount = categories.filter(cat => userVotes[cat] !== null).length;
    const totalCategories = 4;
    const progressPercent = (votedCount / totalCategories) * 100;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
    
    // Update progress text
    const progressText = document.getElementById('progressText');
    const progressPercentElement = document.getElementById('progressPercent');
    
    if (progressText) {
        progressText.textContent = `${votedCount}/${totalCategories} Categories Voted`;
    }
    
    if (progressPercentElement) {
        progressPercentElement.textContent = `${Math.round(progressPercent)}%`;
    }
    
    // Update user stats
    const votedCountElement = document.getElementById('votedCount');
    const pendingCountElement = document.getElementById('pendingCount');
    
    if (votedCountElement) {
        votedCountElement.textContent = votedCount;
    }
    
    if (pendingCountElement) {
        pendingCountElement.textContent = totalCategories - votedCount;
    }
    
    // Update total votes
    updateTotalVotes();
}

// Update total votes count
async function updateTotalVotes() {
    try {
        const response = await fetch('/api/results');
        if (!response.ok) throw new Error('Failed to load results');
        const results = await response.json();
        
        let totalVotes = 0;
        Object.values(results).forEach(categoryResults => {
            categoryResults.forEach(result => {
                totalVotes += result.votes || 0;
            });
        });
        
        const totalVotesElement = document.getElementById('totalVotesCount');
        if (totalVotesElement) {
            totalVotesElement.textContent = totalVotes.toLocaleString();
        }
    } catch (error) {
        console.error('Error updating total votes:', error);
    }
}

// Load live results
async function loadLiveResults() {
    const resultsContainer = document.getElementById('myResults');
    if (!resultsContainer) return;
    
    try {
        const response = await fetch('/api/results');
        if (!response.ok) throw new Error('Failed to load results');
        const results = await response.json();
        
        resultsContainer.innerHTML = '';
        
        // Create results display for each category
        Object.keys(results).forEach(category => {
            const categoryResults = results[category];
            if (!categoryResults || categoryResults.length === 0) return;
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            
            // Find top 3 results
            const topResults = categoryResults.slice(0, 3);
            
            let resultsHTML = `
                <h4>${category}</h4>
                <div class="results-list">
            `;
            
            topResults.forEach((result, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                const isUserVote = userVotes[category] === result.name;
                
                resultsHTML += `
                    <div class="result-item ${isUserVote ? 'user-vote' : ''}">
                        <span class="rank">${medal}</span>
                        <span class="name">${result.name}</span>
                        <span class="votes">${result.votes} votes</span>
                        ${isUserVote ? '<span class="your-vote">Your Vote</span>' : ''}
                    </div>
                `;
            });
            
            resultsHTML += '</div>';
            resultCard.innerHTML = resultsHTML;
            resultsContainer.appendChild(resultCard);
        });
        
        if (resultsContainer.children.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No votes yet. Be the first to vote!</p>';
        }
        
    } catch (error) {
        console.error('Error loading results:', error);
        resultsContainer.innerHTML = '<p class="error">Failed to load results. Please try again.</p>';
    }
}

// Show voting results
function showMyResults() {
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        loadLiveResults();
    }
}

// Refresh votes
function refreshVotes() {
    checkAllVotingStatus();
    updateProgress();
    loadLiveResults();
    showToast('Votes refreshed!', 'info');
}

// Admin login
async function adminLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    errorElement.textContent = '';
    
    if (!username || !password) {
        errorElement.textContent = 'Please enter username and password';
        return;
    }
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store admin token
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Show admin link
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.style.display = 'block';
            }
            
            showToast('Admin login successful!', 'success');
            hideAuthModal();
            
            // Redirect to admin page after 1 second
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            errorElement.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorElement.textContent = 'Network error. Please try again.';
        console.error('Admin login error:', error);
    }
}

// Hide auth modal
function hideAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'none';
    }
}

// Continue as guest
function continueAsGuest() {
    hideAuthModal();
    showToast('Welcome! You can vote without registration.', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Check if user is admin
function checkAdminStatus() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (adminToken && adminUser) {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = 'block';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    checkAdminStatus();
    
    // Close modals when clicking outside
    const confirmModal = document.getElementById('confirmModal');
    const authModal = document.getElementById('authModal');
    
    window.onclick = function(event) {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === authModal) {
            hideAuthModal();
        }
    };
    
    // Auto-refresh results every 30 seconds
    setInterval(loadLiveResults, 30000);
    
    // Setup admin login button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function() {
            if (authModal) {
                authModal.style.display = 'flex';
            }
        });
    }
    
    // Setup admin login form
    const adminLoginButton = document.getElementById('adminLoginButton');
    if (adminLoginButton) {
        adminLoginButton.addEventListener('click', adminLogin);
    }
    
    // Allow Enter key in admin login form
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }
});
