// Admin Dashboard - Complete Implementation
let adminData = null;
let voteChart = null;
let categoryChart = null;
let currentPage = 1;
let itemsPerPage = 10;
let totalActivities = 0;

// Initialize admin dashboard
async function initAdmin() {
    // Check authentication
    if (!checkAdminAuth()) {
        redirectToLogin();
        return;
    }
    
    // Show loading
    showLoading(true);
    
    try {
        // Load all data
        await Promise.all([
            loadDashboardData(),
            loadVotingResults(),
            loadRecentActivity(),
            loadSystemInfo()
        ]);
        
        // Initialize charts
        initCharts();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update welcome message
        updateWelcomeMessage();
        
        // Start auto-refresh
        startAutoRefresh();
        
    } catch (error) {
        console.error('Failed to initialize admin:', error);
        showNotification('Failed to load dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

// Check admin authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('adminTokenExpiry');
    
    if (!token || !expiry) {
        return false;
    }
    
    if (Date.now() > parseInt(expiry)) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiry');
        return false;
    }
    
    return true;
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Load dashboard data
async function loadDashboardData() {
    // Simulate API call - replace with actual API endpoint
    const mockData = {
        totalVotes: 1568,
        uniqueVoters: 423,
        averageVotes: 392,
        votesToday: 128,
        voteTrend: '+12.5%',
        voterTrend: 28,
        avgTrend: '+4.2%',
        activityTrend: 15
    };
    
    // Update UI with data
    document.getElementById('totalVotes').textContent = mockData.totalVotes.toLocaleString();
    document.getElementById('uniqueVoters').textContent = mockData.uniqueVoters.toLocaleString();
    document.getElementById('averageVotes').textContent = mockData.averageVotes.toLocaleString();
    document.getElementById('votesToday').textContent = mockData.votesToday;
    document.getElementById('voteTrend').textContent = mockData.voteTrend;
    document.getElementById('voterTrend').textContent = mockData.voterTrend;
    document.getElementById('avgTrend').textContent = mockData.avgTrend;
    document.getElementById('activityTrend').textContent = mockData.activityTrend;
    
    adminData = mockData;
}

// Load voting results
async function loadVotingResults() {
    // Simulate API call - replace with actual API endpoint
    const mockResults = {
        anime: [
            { name: 'Attack on Titan: Final Season', votes: 456, percentage: 29.1 },
            { name: 'Jujutsu Kaisen', votes: 389, percentage: 24.8 },
            { name: 'Demon Slayer: Mugen Train', votes: 342, percentage: 21.8 },
            { name: 'Re:Zero Season 3', votes: 212, percentage: 13.5 },
            { name: 'Other', votes: 169, percentage: 10.8 }
        ],
        studio: [
            { name: 'MAPPA', votes: 623, percentage: 39.7 },
            { name: 'Ufotable', votes: 512, percentage: 32.6 },
            { name: 'Kyoto Animation', votes: 433, percentage: 27.7 }
        ],
        actor: [
            { name: 'Yuki Kaji', votes: 567, percentage: 36.2 },
            { name: 'Natsuki Hanae', votes: 489, percentage: 31.2 },
            { name: 'Jun Fukuyama', votes: 398, percentage: 25.4 },
            { name: 'Other', votes: 114, percentage: 7.2 }
        ],
        anticipated: [
            { name: 'Attack on Titan: The Final Battle', votes: 845, percentage: 53.9 },
            { name: 'Chainsaw Man Season 2', votes: 723, percentage: 46.1 }
        ]
    };
    
    // Update results displays
    updateResultsDisplay('anime', mockResults.anime);
    updateResultsDisplay('studio', mockResults.studio);
    updateResultsDisplay('actor', mockResults.actor);
    updateResultsDisplay('anticipated', mockResults.anticipated);
}

// Update results display
function updateResultsDisplay(category, results) {
    const container = document.getElementById(`${category}Results`).querySelector('.results-list');
    
    container.innerHTML = results.map((result, index) => `
        <div class="result-item">
            <div class="result-rank">${index + 1}</div>
            <div class="result-info">
                <div class="result-name">${result.name}</div>
                <div class="result-stats">
                    <span class="vote-count">
                        <i class="fas fa-vote-yea"></i>
                        ${result.votes.toLocaleString()} votes
                    </span>
                    <span class="vote-percentage">${result.percentage}%</span>
                </div>
                <div class="vote-progress">
                    <div class="vote-progress-bar" style="width: ${result.percentage}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load recent activity
async function loadRecentActivity(page = 1) {
    // Simulate API call - replace with actual API endpoint
    const mockActivities = [
        { time: '2 minutes ago', user: 'anime_lover_42', category: 'Best Anime', vote: 'Attack on Titan', ip: '192.168.1.1', status: 'success' },
        { time: '5 minutes ago', user: 'weeb_king', category: 'Best Studio', vote: 'MAPPA', ip: '10.0.0.5', status: 'success' },
        { time: '12 minutes ago', user: 'otaku_girl', category: 'Best Actor', vote: 'Yuki Kaji', ip: '172.16.0.8', status: 'success' },
        { time: '25 minutes ago', user: 'demo_user', category: 'Most Anticipated', vote: 'Chainsaw Man', ip: '203.0.113.42', status: 'success' },
        { time: '1 hour ago', user: 'anonymous', category: 'Best Anime', vote: 'Jujutsu Kaisen', ip: '192.168.100.10', status: 'warning' },
        { time: '2 hours ago', user: 'voter123', category: 'Best Studio', vote: 'Ufotable', ip: '10.1.1.15', status: 'success' },
        { time: '3 hours ago', user: 'anime_fan', category: 'Best Actor', vote: 'Natsuki Hanae', ip: '192.168.0.25', status: 'success' },
        { time: '5 hours ago', user: 'test_account', category: 'Most Anticipated', vote: 'Attack on Titan', ip: '198.51.100.1', status: 'success' },
        { time: '6 hours ago', user: 'weeb_master', category: 'Best Anime', vote: 'Demon Slayer', ip: '203.0.113.5', status: 'success' },
        { time: '8 hours ago', user: 'otaku_sama', category: 'Best Studio', vote: 'Kyoto Animation', ip: '192.168.1.100', status: 'success' }
    ];
    
    totalActivities = 42; // Mock total
    
    // Filter activities based on current filters
    const timeFilter = document.getElementById('timeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredActivities = [...mockActivities];
    
    // Apply time filter (simplified)
    if (timeFilter !== 'all') {
        // In real implementation, filter by actual timestamps
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredActivities = filteredActivities.filter(activity => 
            activity.category === categoryFilter
        );
    }
    
    // Calculate pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
    
    // Update activity table
    const tableBody = document.getElementById('activityTable');
    tableBody.innerHTML = paginatedActivities.map(activity => `
        <tr>
            <td>${activity.time}</td>
            <td>${activity.user}</td>
            <td>${activity.category}</td>
            <td><strong>${activity.vote}</strong></td>
            <td><code>${activity.ip}</code></td>
            <td>
                <span class="status-badge ${activity.status}">
                    ${activity.status === 'success' ? '✓ Success' : '⚠ Warning'}
                </span>
            </td>
        </tr>
    `).join('');
    
    // Update pagination controls
    updatePagination(page, Math.ceil(filteredActivities.length / itemsPerPage));
}

// Load system information
async function loadSystemInfo() {
    // Simulate API call - replace with actual API endpoint
    const mockSystemInfo = {
        dbRecords: '1,568',
        dbStorage: '4.2 MB',
        lastBackup: 'Today, 02:00',
        activeSessions: 3,
        failedLogins: 2,
        lastAudit: 'Yesterday',
        responseTime: '45 ms',
        systemUptime: '5d 12h 30m',
        memoryUsage: '42%'
    };
    
    // Update UI
    document.getElementById('dbRecords').textContent = mockSystemInfo.dbRecords;
    document.getElementById('dbStorage').textContent = mockSystemInfo.dbStorage;
    document.getElementById('lastBackup').textContent = mockSystemInfo.lastBackup;
    document.getElementById('activeSessions').textContent = mockSystemInfo.activeSessions;
    document.getElementById('failedLogins').textContent = mockSystemInfo.failedLogins;
    document.getElementById('lastAudit').textContent = mockSystemInfo.lastAudit;
    document.getElementById('responseTime').textContent = mockSystemInfo.responseTime;
    document.getElementById('systemUptime').textContent = mockSystemInfo.systemUptime;
    document.getElementById('memoryUsage').textContent = mockSystemInfo.memoryUsage;
}

// Initialize charts
function initCharts() {
    // Destroy existing charts if they exist
    if (voteChart) {
        voteChart.destroy();
    }
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Vote Distribution Chart
    const voteCtx = document.getElementById('voteChart').getContext('2d');
    voteChart = new Chart(voteCtx, {
        type: 'bar',
        data: {
            labels: ['Attack on Titan', 'Jujutsu Kaisen', 'Demon Slayer', 'Re:Zero', 'MAPPA', 'Ufotable', 'Kyoto Animation', 'Yuki Kaji', 'Natsuki Hanae', 'Jun Fukuyama'],
            datasets: [{
                label: 'Votes',
                data: [456, 389, 342, 212, 623, 512, 433, 567, 489, 398],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(20, 184, 166, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(168, 85, 247, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(20, 184, 166, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Votes: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Votes'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Category Comparison Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: ['Best Anime', 'Best Studio', 'Best Actor', 'Most Anticipated'],
            datasets: [{
                data: [1399, 1568, 1568, 1568],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} votes (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Export button
    document.getElementById('exportData').addEventListener('click', exportDashboardData);
    
    // Refresh button
    document.getElementById('refreshData').addEventListener('click', refreshDashboard);
    
    // Reset votes button
    document.getElementById('resetVotes').addEventListener('click', confirmResetVotes);
    
    // Logout button
    document.getElementById('logoutAdmin').addEventListener('click', logoutAdmin);
    
    // Filter changes
    document.getElementById('timeFilter').addEventListener('change', () => {
        currentPage = 1;
        loadRecentActivity(currentPage);
    });
    
    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        loadRecentActivity(currentPage);
    });
}

// Update welcome message
function updateWelcomeMessage() {
    const username = 'Administrator';
    const time = new Date().getHours();
    let greeting;
    
    if (time < 12) greeting = 'Good morning';
    else if (time < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    const welcomeElement = document.getElementById('adminWelcome');
    if (welcomeElement) {
        welcomeElement.innerHTML = `<i class="fas fa-user-shield"></i> ${greeting}, ${username}`;
    }
}

// Switch result tabs
function switchResultTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.result-tab').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Results`).classList.add('active');
}

// Update chart type
function updateChartType() {
    const type = document.getElementById('chartTypeSelect').value;
    voteChart.config.type = type;
    voteChart.update();
}

// Update pie chart type
function updatePieChart() {
    const type = document.getElementById('pieTypeSelect').value;
    categoryChart.config.type = type;
    categoryChart.update();
}

// Filter activity
function filterActivity() {
    currentPage = 1;
    loadRecentActivity(currentPage);
}

// Update pagination
function updatePagination(current, total) {
    document.getElementById('pageInfo').textContent = `Page ${current} of ${total}`;
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = current === 1;
    nextBtn.disabled = current === total;
}

// Change page
function changePage(direction) {
    currentPage += direction;
    loadRecentActivity(currentPage);
}

// Export activity log
function exportActivity() {
    const data = [
        ['Time', 'User', 'Category', 'Vote', 'IP Address', 'Status'],
        ['2 minutes ago', 'anime_lover_42', 'Best Anime', 'Attack on Titan', '192.168.1.1', 'success'],
        ['5 minutes ago', 'weeb_king', 'Best Studio', 'MAPPA', '10.0.0.5', 'success'],
        // Add more data as needed
    ];
    
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('Activity log exported successfully', 'success');
}

// Export dashboard data
function exportDashboardData() {
    const data = {
        exportDate: new Date().toISOString(),
        dashboardStats: adminData,
        // Add more data as needed
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showNotification('Dashboard data exported successfully', 'success');
}

// Refresh dashboard
async function refreshDashboard() {
    showLoading(true);
    
    try {
        await Promise.all([
            loadDashboardData(),
            loadVotingResults(),
            loadRecentActivity(currentPage),
            loadSystemInfo()
        ]);
        
        voteChart.update();
        categoryChart.update();
        
        showNotification('Dashboard refreshed successfully', 'success');
    } catch (error) {
        showNotification('Failed to refresh dashboard', 'error');
    } finally {
        showLoading(false);
    }
}

// Confirm reset votes
function confirmResetVotes() {
    if (confirm('⚠️ WARNING: This will delete ALL voting data!\n\nThis action cannot be undone. Are you absolutely sure?')) {
        resetVotes();
    }
}

// Reset votes (simulated)
function resetVotes() {
    showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        // Reset all data
        adminData = {
            totalVotes: 0,
            uniqueVoters: 0,
            averageVotes: 0,
            votesToday: 0,
            voteTrend: '0%',
            voterTrend: 0,
            avgTrend: '0%',
            activityTrend: 0
        };
        
        // Update UI
        loadDashboardData();
        loadVotingResults();
        voteChart.update();
        categoryChart.update();
        
        showLoading(false);
        showNotification('All votes have been reset successfully', 'success');
    }, 1000);
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTokenExpiry');
    redirectToLogin();
}

// Show backup modal
function showBackupModal() {
    document.getElementById('backupModal').style.display = 'flex';
}

// Hide backup modal
function hideBackupModal() {
    document.getElementById('backupModal').style.display = 'none';
}

// Perform backup
function performBackup() {
    showLoading(true);
    
    // Simulate backup process
    setTimeout(() => {
        showLoading(false);
        hideBackupModal();
        showNotification('Database backup created successfully', 'success');
    }, 2000);
}

// Clear cache
function clearCache() {
    if (confirm('Clear all cached data?')) {
        localStorage.clear();
        sessionStorage.clear();
        showNotification('Cache cleared successfully', 'success');
        
        // Reload page
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// Show loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 4000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    // Add icon
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    notification.innerHTML = `<span style="font-weight: bold;">${icon}</span> ${message}`;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Start auto-refresh
function startAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadDashboardData();
            loadRecentActivity(currentPage);
        }
    }, 5 * 60 * 1000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize admin dashboard when page loads
window.onload = initAdmin;