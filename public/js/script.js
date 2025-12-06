// Global variables
let userVotes = {};
let currentVote = null;
let userName = null;

// Initialize the application
async function initApp() {
    try {
        // Remove login requirement - users can vote without login
        hideAuthModal();
        
        // Load user votes from localStorage
        loadUserVotes();
        
        // Check voting status for each category
        await checkAllVotingStatus();
        
        // Load categories from server
        await loadCategories();
        
        // Load nominees from server
        await loadNominees();
        
        // Update progress
        updateProgress();
        
        // Show user panel (no login required)
        showUserPanel();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error loading voting data', 'error');
    }
}

// Hide auth modal (no login required)
function hideAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'none';
    }
    
    // Show user info panel
    showUserPanel();
}

// Show user panel (no login required)
function showUserPanel() {
    const userPanel = document.getElementById('userPanel');
    const userInfo = document.getElementById('userInfo');
    
    if (userPanel) {
        userPanel.style.display = 'block';
    }
    
    if (userInfo) {
        userInfo.style.display = 'flex';
        
        // Generate random username if not exists
        if (!userName) {
            const adjectives = ['Anime', 'Otaku', 'Weeb', 'Manga', 'Kawaii', 'Senpai', 'Kitsune'];
            const nouns = ['Lover', 'Fan', 'Master', 'Warrior', 'Ninja', 'Samurai', 'Knight'];
            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
            userName = `${randomAdj}${randomNoun}${Math.floor(Math.random() * 1000)}`;
            
            // Store in localStorage
            localStorage.setItem('userName', userName);
        } else {
            userName = localStorage.getItem('userName');
        }
        
        document.getElementById('usernameDisplay').textContent = `Hello, ${userName}!`;
    }
}

// Load categories from server
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to load categories');
        const categories = await response.json();
        
        // Update categories if needed
        console.log('Loaded categories:', categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load nominees from server
async function loadNominees() {
    try {
        const response = await fetch('/api/nominees');
        if (!response.ok) throw new Error('Failed to load nominees');
        const nominees = await response.json();
        
        // Update nominees if needed
        console.log('Loaded nominees:', nominees);
    } catch (error) {
        console.error('Error loading nominees:', error);
    }
}

// Check voting status for all categories
async function checkAllVotingStatus() {
    const categories = [
        'Best Anime of 2025',
        'Best Animation Studio',
        'Best Voice Actor of 2025',
        'Most Anticipated Anime of 2025'
    ];
    
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
    
    message.textContent = `Are you sure you want to vote for "${selection}" in "${category}"?`;
    modal.style.display = 'flex';
}

// Confirm vote
async function confirmVote(confirmed) {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    
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
            
            // Show success message
            showToast(`Successfully voted for ${currentVote.selection}!`, 'success');
            
            // Save to localStorage
            saveUserVotes();
            
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
            btn.textContent = 'Already Voted';
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

// Load user votes from localStorage
function loadUserVotes() {
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
        try {
            userVotes = JSON.parse(savedVotes);
            
            // Update UI for already voted categories
            Object.keys(userVotes).forEach(category => {
                if (userVotes[category]) {
                    updateCategoryStatus(category, userVotes[category]);
                }
            });
        } catch (error) {
            console.error('Error loading user votes:', error);
        }
    } else {
        // Initialize empty votes
        userVotes = {
            'Best Anime of 2025': null,
            'Best Animation Studio': null,
            'Best Voice Actor of 2025': null,
            'Most Anticipated Anime of 2025': null
        };
    }
}

// Save user votes to localStorage
function saveUserVotes() {
    try {
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
    } catch (error) {
        console.error('Error saving user votes:', error);
    }
}

// Show my voting results
async function showMyResults() {
    const resultsContainer = document.getElementById('myResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    // Get global results
    try {
        const response = await fetch('/api/results');
        if (!response.ok) throw new Error('Failed to load results');
        const globalResults = await response.json();
        
        // Create results display
        Object.keys(userVotes).forEach(category => {
            const selection = userVotes[category];
            if (!selection) return;
            
            const categoryResults = globalResults[category] || [];
            const userVoteResult = categoryResults.find(r => r.name === selection);
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            
            resultCard.innerHTML = `
                <h4>${category}</h4>
                <div class="result-selection">
                    <strong>Your Vote:</strong> ${selection}
                </div>
                <div class="result-stats">
                    <span class="result-votes">
                        <i class="fas fa-chart-bar"></i> 
                        Votes: ${userVoteResult ? userVoteResult.votes : 'N/A'}
                    </span>
                    <span class="result-rank">
                        <i class="fas fa-trophy"></i>
                        Rank: ${getRank(categoryResults, selection)}
                    </span>
                </div>
            `;
            
            resultsContainer.appendChild(resultCard);
        });
        
        if (resultsContainer.children.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">You haven\'t voted in any categories yet!</p>';
        }
        
        // Scroll to results section
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading results:', error);
        resultsContainer.innerHTML = '<p class="error">Failed to load results. Please try again.</p>';
    }
}

// Get rank of a selection in results
function getRank(results, selection) {
    if (!results || results.length === 0) return 'N/A';
    
    const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
    const rank = sortedResults.findIndex(r => r.name === selection);
    
    if (rank === -1) return 'N/A';
    if (rank === 0) return '1st 🥇';
    if (rank === 1) return '2nd 🥈';
    if (rank === 2) return '3rd 🥉';
    return `${rank + 1}th`;
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

// Tab switching for auth modal (kept for consistency, though modal is hidden)
function switchTab(tabName) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginBtn = document.querySelector('.tab-btn[onclick="switchTab(\'login\')"]');
    const registerBtn = document.querySelector('.tab-btn[onclick="switchTab(\'register\')"]');
    
    if (tabName === 'login') {
        loginTab.style.display = 'block';
        registerTab.style.display = 'none';
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        loginTab.style.display = 'none';
        registerTab.style.display = 'block';
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
    }
}

// Login function (kept for admin link)
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    errorElement.textContent = '';
    
    if (!username || !password) {
        errorElement.textContent = 'Please enter username and password';
        return;
    }
    
    try {
        // For admin login
        if (username === 'admin') {
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
            } else {
                errorElement.textContent = data.error || 'Login failed';
            }
        } else {
            // For regular user login (if needed)
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
            
            const data = await response.json();
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            userName = data.user.username;
            showUserPanel();
            hideAuthModal();
            showToast('Welcome back!', 'success');
        }
    } catch (error) {
        errorElement.textContent = error.message;
        console.error('Login error:', error);
    }
}

// Register function (kept for consistency)
async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorElement = document.getElementById('registerError');
    
    errorElement.textContent = '';
    
    if (!username || !password) {
        errorElement.textContent = 'Please enter username and password';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        
        showToast('Registration successful! You can now login.', 'success');
        switchTab('login');
        document.getElementById('loginUsername').value = username;
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        
    } catch (error) {
        errorElement.textContent = error.message;
        console.error('Registration error:', error);
    }
}

// Logout function
function logout() {
    // Clear all local storage
    localStorage.clear();
    
    // Reload the page
    location.reload();
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
    
    // Close modal when clicking outside
    const modal = document.getElementById('confirmModal');
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Check for existing votes every 30 seconds
    setInterval(checkAllVotingStatus, 30000);
});
