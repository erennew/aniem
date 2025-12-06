
// Public Voting System - One Vote Per IP Per Category
let userVotes = {
    'Best Anime of 2025': null,
    'Best Animation Studio': null,
    'Best Voice Actor of 2025': null,
    'Most Anticipated Anime of 2025': null
};
let currentVote = null;
let clientIP = null;
let hasVotedCache = {};

// Initialize the application
async function initApp() {
    // Get client IP
    await getClientIP();
    
    // Check voting status for each category
    await checkAllVotingStatus();
    
    // Update progress
    updateProgress();
    
    // Load live results
    await loadLiveResults();
    
    console.log('Public voting system initialized');
    console.log('Client IP:', clientIP);
}

// Get client IP from server
async function getClientIP() {
    try {
        const response = await fetch('/api/check-vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category: 'Best Anime of 2025' })
        });
        
        if (response.ok) {
            const data = await response.json();
            clientIP = data.ip;
            console.log('Your IP address:', clientIP);
        } else {
            // Fallback to local IP detection
            clientIP = 'local-' + Math.random().toString(36).substr(2, 9);
            console.log('Using fallback IP:', clientIP);
        }
    } catch (error) {
        console.error('Error getting IP:', error);
        clientIP = 'error-' + Math.random().toString(36).substr(2, 9);
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
            
            hasVotedCache[category] = data.hasVoted;
            
            if (data.hasVoted) {
                // User has already voted in this category
                userVotes[category] = 'Already Voted';
                updateCategoryStatus(category, 'Already Voted');
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
async function vote(selection, category) {
    // Check cache first
    if (hasVotedCache[category]) {
        showToast(`You have already voted in "${category}" from this IP address`, 'warning');
        return;
    }
    
    // Double-check with server
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
                showToast(`You have already voted in "${category}" from this IP address`, 'warning');
                hasVotedCache[category] = true;
                updateCategoryStatus(category, 'Already Voted');
                return;
            }
        }
    } catch (error) {
        console.error('Error checking vote:', error);
    }
    
    currentVote = { selection, category };
    
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    if (modal && message) {
        message.textContent = `Are you sure you want to vote for "${selection}" in "${category}"?\n\nNote: You can only vote once per category from this IP address.`;
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
                selection: currentVote.selection
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Vote successful
            userVotes[currentVote.category] = currentVote.selection;
            hasVotedCache[currentVote.category] = true;
            
            // Update UI
            updateCategoryStatus(currentVote.category, currentVote.selection);
            updateProgress();
            await loadLiveResults();
            
            // Show success message
            showToast(`Successfully voted for ${currentVote.selection}! (IP: ${clientIP})`, 'success');
            
        } else {
            // Show error
            showToast(data.error || 'Failed to submit vote', 'error');
            
            // Update cache if server says already voted
            if (data.error && data.error.includes('already voted')) {
                hasVotedCache[currentVote.category] = true;
                updateCategoryStatus(currentVote.category, 'Already Voted');
            }
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
        statusElement.textContent = selection === 'Already Voted' ? 
            'Already Voted (IP)' : `Voted: ${selection}`;
        statusElement.className = 'category-status voted';
    }
    
    // Disable vote buttons in this category
    if (categoryElement) {
        const voteButtons = categoryElement.querySelectorAll('.vote-btn');
        voteButtons.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = selection === 'Already Voted' ? 
                '<i class="fas fa-ban"></i> IP Used' : 
                '<i class="fas fa-check-circle"></i> Voted';
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
    
    // Show IP info
    if (clientIP) {
        const ipInfo = document.getElementById('ipInfo');
        if (!ipInfo) {
            // Create IP info element
            const header = document.querySelector('.header-container');
            if (header) {
                const ipElement = document.createElement('div');
                ipElement.id = 'ipInfo';
                ipElement.style.cssText = `
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 5px;
                    text-align: center;
                `;
                ipElement.textContent = `Your IP: ${clientIP} (One vote per category per IP)`;
                header.appendChild(ipElement);
            }
        }
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
        
        displayResults(results);
        
    } catch (error) {
        console.error('Error loading results:', error);
        
        // Use mock results if server is not available
        const mockResults = {
            'Best Anime of 2025': [
                { name: 'Attack on Titan: Final Season', votes: 456 },
                { name: 'Jujutsu Kaisen', votes: 389 },
                { name: 'Demon Slayer: Mugen Train', votes: 342 }
            ],
            'Best Animation Studio': [
                { name: 'MAPPA', votes: 523 },
                { name: 'Ufotable', votes: 421 },
                { name: 'Kyoto Animation', votes: 398 }
            ],
            'Best Voice Actor of 2025': [
                { name: 'Yuki Kaji', votes: 267 },
                { name: 'Natsuki Hanae', votes: 245 },
                { name: 'Jun Fukuyama', votes: 189 }
            ],
            'Most Anticipated Anime of 2025': [
                { name: 'Attack on Titan: The Final Battle', votes: 512 },
                { name: 'Chainsaw Man Season 2', votes: 467 }
            ]
        };
        
        displayResults(mockResults);
    }
}

// Display results
function displayResults(results) {
    const resultsContainer = document.getElementById('myResults');
    if (!resultsContainer) return;
    
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
            <h3>${category}</h3>
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
}

// Get voting statistics
async function getVotingStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            console.log('Voting Statistics:', stats);
            
            // Display stats in UI
            const statsElement = document.getElementById('statsInfo');
            if (!statsElement) {
                const container = document.querySelector('.container');
                if (container) {
                    const statsDiv = document.createElement('div');
                    statsDiv.id = 'statsInfo';
                    statsDiv.style.cssText = `
                        background: #f8f9fa;
                        padding: 10px;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-size: 0.9rem;
                        color: #666;
                    `;
                    statsDiv.innerHTML = `
                        <strong>Voting Stats:</strong> 
                        ${stats.totalVotes} total votes • 
                        ${stats.uniqueVoters} unique voters • 
                        ${Object.keys(stats.votesByCategory || {}).length} categories
                    `;
                    container.insertBefore(statsDiv, container.firstChild);
                }
            }
        }
    } catch (error) {
        console.error('Error getting stats:', error);
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

// Reset all votes (for testing - only works if server allows)
async function resetAllVotes() {
    if (confirm('Reset all your votes? This will clear your voting history from this IP.')) {
        try {
            const response = await fetch('/api/reset-votes', {
                method: 'POST'
            });
            
            if (response.ok) {
                // Reset local state
                userVotes = {
                    'Best Anime of 2025': null,
                    'Best Animation Studio': null,
                    'Best Voice Actor of 2025': null,
                    'Most Anticipated Anime of 2025': null
                };
                
                hasVotedCache = {};
                
                // Reset UI
                document.querySelectorAll('.category-status').forEach(status => {
                    status.textContent = 'Not Voted';
                    status.className = 'category-status';
                });
                
                document.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-vote-yea"></i> Vote Now';
                    btn.classList.remove('disabled');
                });
                
                updateProgress();
                await checkAllVotingStatus();
                showToast('All votes reset! You can vote again.', 'success');
            } else {
                showToast('Cannot reset votes', 'error');
            }
        } catch (error) {
            showToast('Error resetting votes', 'error');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Get stats
    setTimeout(() => {
        getVotingStats();
    }, 1000);
    
    // Close modals when clicking outside
    const confirmModal = document.getElementById('confirmModal');
    const authModal = document.getElementById('authModal');
    
    window.onclick = function(event) {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    };
    
    // Auto-refresh results every 30 seconds
    setInterval(loadLiveResults, 30000);
    
    // Auto-check voting status every minute
    setInterval(checkAllVotingStatus, 60000);
});
