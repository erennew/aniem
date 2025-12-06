[file name]: admin-fixed.html
[file content begin]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Anime Voting System</title>
    <link rel="stylesheet" href="/css/admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        /* Additional styles for admin dashboard */
        .admin-container {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .dashboard-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .dashboard-card:hover {
            transform: translateY(-5px);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .card-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }
        
        .icon-votes { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .icon-users { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .icon-theme { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .icon-settings { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        
        .card-stats {
            font-size: 2rem;
            font-weight: 700;
            margin: 10px 0;
            color: #333;
        }
        
        .card-trend {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9rem;
        }
        
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        
        .section-title {
            font-size: 1.5rem;
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
            color: #333;
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
            .charts-container {
                grid-template-columns: 1fr;
            }
        }
        
        .chart-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .chart-actions button {
            background: none;
            border: 1px solid #ddd;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 5px;
        }
        
        .users-table-container {
            overflow-x: auto;
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .users-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .users-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        
        .users-table td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .user-role {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .user-role.admin {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .user-role.user {
            background: #f0fdf4;
            color: #166534;
        }
        
        .user-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .user-status.active {
            background: #d1fae5;
            color: #065f46;
        }
        
        .user-status.inactive {
            background: #fef3c7;
            color: #92400e;
        }
        
        .themes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .theme-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .theme-card:hover {
            transform: translateY(-5px);
        }
        
        .theme-card.active {
            border: 2px solid #667eea;
        }
        
        .theme-preview {
            height: 100px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .theme-info {
            padding: 15px;
        }
        
        .theme-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .badge-active {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
        }
        
        .settings-form {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #495057;
        }
        
        .form-group input[type="text"],
        .form-group input[type="date"],
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            font-size: 1rem;
        }
        
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .layout-settings {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .layout-options {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }
        
        .layout-option {
            flex: 1;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .layout-option:hover,
        .layout-option.active {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .layout-option i {
            font-size: 2rem;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .btn-small {
            padding: 6px 12px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-success {
            background: #10b981;
            color: white;
        }
        
        .btn-warning {
            background: #f59e0b;
            color: white;
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <!-- Admin Header -->
    <header class="admin-header">
        <div class="admin-header-content">
            <div class="header-left">
                <h1><i class="fas fa-chart-bar"></i> Admin Dashboard</h1>
                <p>Anime Voting System Analytics</p>
            </div>
            <div class="admin-controls">
                <button id="logoutAdmin" class="btn-logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="admin-container">
        <!-- Welcome Banner -->
        <div class="welcome-banner">
            <h2><i class="fas fa-user-shield"></i> Welcome, Administrator</h2>
            <p>Last login: Today at <span id="currentTime"></span></p>
        </div>
        
        <!-- Quick Stats -->
        <h2 class="section-title"><i class="fas fa-tachometer-alt"></i> Quick Stats</h2>
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header">
                    <h3>Total Votes</h3>
                    <div class="card-icon icon-votes">
                        <i class="fas fa-vote-yea"></i>
                    </div>
                </div>
                <div class="card-stats" id="totalVotes">0</div>
                <div class="card-trend trend-up">
                    <i class="fas fa-arrow-up"></i>
                    <span id="voteTrend">+0%</span> from yesterday
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-header">
                    <h3>Unique Voters</h3>
                    <div class="card-icon icon-users">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
                <div class="card-stats" id="uniqueVoters">0</div>
                <div class="card-trend trend-up">
                    <i class="fas fa-user-plus"></i>
                    <span id="voterTrend">0</span> new today
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-header">
                    <h3>Avg. Votes</h3>
                    <div class="card-icon icon-votes">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
                <div class="card-stats" id="averageVotes">0</div>
                <div class="card-trend trend-up">
                    <i class="fas fa-chart-line"></i>
                    <span id="avgTrend">+0%</span> increase
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-header">
                    <h3>Today's Votes</h3>
                    <div class="card-icon icon-votes">
                        <i class="fas fa-calendar-day"></i>
                    </div>
                </div>
                <div class="card-stats" id="votesToday">0</div>
                <div class="card-trend trend-up">
                    <i class="fas fa-bolt"></i>
                    <span id="activityTrend">0</span> active
                </div>
            </div>
        </div>
        
        <!-- Charts -->
        <h2 class="section-title"><i class="fas fa-chart-bar"></i> Analytics</h2>
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <h3>Vote Distribution</h3>
                    <div class="chart-actions">
                        <button title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <canvas id="voteChart" height="250"></canvas>
            </div>
            
            <div class="chart-card">
                <div class="chart-header">
                    <h3>Category Comparison</h3>
                    <div class="chart-actions">
                        <select id="chartType">
                            <option value="pie">Pie Chart</option>
                            <option value="doughnut">Doughnut</option>
                            <option value="bar">Bar Chart</option>
                        </select>
                    </div>
                </div>
                <canvas id="categoryChart" height="250"></canvas>
            </div>
        </div>
        
        <!-- User Management -->
        <h2 class="section-title"><i class="fas fa-users"></i> User Management</h2>
        <div id="userManagementSection">
            <!-- User management content will be loaded here -->
        </div>
        
        <!-- Design & Theme -->
        <h2 class="section-title"><i class="fas fa-palette"></i> Design & Theme</h2>
        <div id="designSettingsSection">
            <!-- Design settings will be loaded here -->
        </div>
        
        <!-- System Settings -->
        <h2 class="section-title"><i class="fas fa-cog"></i> System Settings</h2>
        <div id="systemSettingsSection">
            <!-- System settings will be loaded here -->
        </div>
        
        <!-- Voting Results -->
        <h2 class="section-title"><i class="fas fa-poll"></i> Voting Results</h2>
        <div class="voting-results">
            <div class="results-tabs">
                <button class="tab-btn active" onclick="switchResultTab('anime')">Best Anime</button>
                <button class="tab-btn" onclick="switchResultTab('studio')">Best Studio</button>
                <button class="tab-btn" onclick="switchResultTab('actor')">Best Actor</button>
                <button class="tab-btn" onclick="switchResultTab('anticipated')">Most Anticipated</button>
            </div>
            
            <div class="results-content">
                <!-- Results will be loaded here -->
                <div id="animeResults" class="result-tab active">
                    <div class="results-list">
                        <!-- Anime results -->
                    </div>
                </div>
                <div id="studioResults" class="result-tab">
                    <div class="results-list">
                        <!-- Studio results -->
                    </div>
                </div>
                <div id="actorResults" class="result-tab">
                    <div class="results-list">
                        <!-- Actor results -->
                    </div>
                </div>
                <div id="anticipatedResults" class="result-tab">
                    <div class="results-list">
                        <!-- Anticipated results -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <h2 class="section-title"><i class="fas fa-history"></i> Recent Activity</h2>
        <div class="recent-activity">
            <div class="activity-filters">
                <select id="timeFilter">
                    <option value="1">Last hour</option>
                    <option value="24" selected>Last 24 hours</option>
                    <option value="168">Last week</option>
                    <option value="720">Last month</option>
                </select>
                <select id="categoryFilter">
                    <option value="all">All Categories</option>
                    <option value="vote">Votes</option>
                    <option value="user">User Activity</option>
                    <option value="system">System</option>
                </select>
            </div>
            
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                        <th>IP Address</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="activityTable">
                    <!-- Activity rows will be loaded here -->
                </tbody>
            </table>
            
            <div class="pagination">
                <button id="prevPage" onclick="changePage(-1)">Previous</button>
                <span id="pageInfo">Page 1 of 1</span>
                <button id="nextPage" onclick="changePage(1)">Next</button>
            </div>
        </div>
    </main>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </div>

    <!-- Notification Container -->
    <div id="notificationContainer"></div>

    <script src="/js/admin-fixed.js"></script>
    <script>
        // Set current time
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Logout function
        document.getElementById('logoutAdmin').addEventListener('click', function() {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminTokenExpiry');
            window.location.href = 'login.html';
        });
    </script>
</body>
</html>
[file content end]
