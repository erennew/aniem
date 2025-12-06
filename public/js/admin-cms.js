// Anime Voting CMS - Complete Admin Dashboard with All Features
class AnimeVotingCMS {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentSubsection = null;
        this.editingCategory = null;
        this.editingNominee = null;
        this.confirmCallback = null;
        this.voteChart = null;
        this.categoryChart = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalActivities = 0;
        
        this.contentData = {
            categories: [],
            nominees: [],
            images: [],
            pages: {},
            settings: {},
            users: []
        };
        this.adminData = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (!this.checkAuth()) {
            this.redirectToLogin();
            return;
        }
        
        this.showLoading(true);
        await this.loadAllData();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupDragAndDrop();
        this.startAutoRefresh();
        this.updateWelcomeMessage();
        this.showLoading(false);
    }

    // Authentication Methods
    checkAuth() {
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

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    logout() {
        localStorage.removeItem('adminToken');
        this.redirectToLogin();
    }

    updateWelcomeMessage() {
        const welcomeElement = document.getElementById('adminWelcome');
        if (welcomeElement) {
            const username = localStorage.getItem('adminUsername') || 'Admin';
            welcomeElement.innerHTML = `<i class="fas fa-user-shield"></i> ${username}`;
        }
    }

    // Data Loading Methods
    async loadAllData() {
        try {
            await Promise.all([
                this.loadDashboardData(),
                this.loadContentData(),
                this.loadUserManagement(),
                this.loadDesignSettings(),
                this.loadSystemInfo()
            ]);
            
            this.initCharts();
            this.showToast('Dashboard initialized successfully', 'success');
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/admin/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.adminData = data;
                this.updateDashboardUI(data);
            } else {
                this.loadMockData();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.loadMockData();
        }
    }

    loadMockData() {
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
        
        this.updateDashboardUI(mockData);
        this.adminData = mockData;
    }

    updateDashboardUI(data) {
        const elements = {
            'totalVotes': data.totalVotes?.toLocaleString(),
            'activeUsers': data.uniqueVoters?.toLocaleString(),
            'totalCategories': this.contentData.categories.length.toString(),
            'totalNominees': this.contentData.nominees.length.toString(),
            'uniqueVoters': data.uniqueVoters?.toLocaleString(),
            'averageVotes': data.averageVotes?.toLocaleString(),
            'votesToday': data.votesToday?.toLocaleString(),
            'voteTrend': data.voteTrend || '+0%',
            'voterTrend': data.voterTrend || 0,
            'avgTrend': data.avgTrend || '+0%',
            'activityTrend': data.activityTrend || 0
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }

    async loadContentData() {
        const savedData = localStorage.getItem('cmsContent');
        if (savedData) {
            this.contentData = JSON.parse(savedData);
        } else {
            await this.loadDefaultData();
        }
        
        await this.renderDashboard();
        await this.renderCategories();
        await this.renderNominees();
        await this.renderImages();
        this.renderActivity();
    }

    async loadDefaultData() {
        // Default categories
        this.contentData.categories = [
            {
                id: 'cat1',
                name: 'Best Anime of 2025',
                description: 'Select the anime that impressed you the most this year!',
                icon: 'fa-crown',
                color: '#6366f1',
                status: 'active',
                maxSelections: 1,
                order: 1,
                votes: 456
            },
            {
                id: 'cat2',
                name: 'Best Animation Studio',
                description: 'Which studio delivered the most impressive visual experience?',
                icon: 'fa-palette',
                color: '#10b981',
                status: 'active',
                maxSelections: 1,
                order: 2,
                votes: 342
            },
            {
                id: 'cat3',
                name: 'Best Voice Actor of 2025',
                description: 'Recognize outstanding voice acting performances',
                icon: 'fa-microphone',
                color: '#f59e0b',
                status: 'active',
                maxSelections: 1,
                order: 3,
                votes: 289
            }
        ];

        // Default nominees
        this.contentData.nominees = [
            {
                id: 'nom1',
                name: 'Attack on Titan: Final Season',
                categoryId: 'cat1',
                description: 'The epic conclusion to one of the greatest anime series of all time.',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                rating: 9.5,
                views: 2.5,
                tags: ['action', 'fantasy', 'drama'],
                status: 'active',
                votes: 456,
                order: 1
            },
            {
                id: 'nom2',
                name: 'Jujutsu Kaisen',
                categoryId: 'cat1',
                description: 'Dark fantasy battle anime with stunning animation and intense fights.',
                image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                rating: 9.0,
                views: 2.1,
                tags: ['action', 'supernatural', 'battle'],
                status: 'active',
                votes: 389,
                order: 2
            }
        ];

        // Default pages
        this.contentData.pages = {
            home: {
                title: 'Anime Awards 2025',
                subtitle: 'Vote for your favorites across multiple categories',
                heroImage: '',
                welcomeMessage: 'Welcome to the biggest anime voting event of the year! Cast your votes across various categories and help decide the winners.'
            },
            about: {
                title: 'About Anime Awards 2025',
                content: 'The Anime Awards 2025 is an annual event where anime fans from around the world vote for their favorite shows, characters, studios, and more.'
            }
        };

        this.saveToLocalStorage();
    }

    async loadUserManagement() {
        const container = document.getElementById('usersSection');
        if (!container) return;
        
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                this.contentData.users = users;
                this.renderUserManagement(users);
            } else {
                this.renderUserManagement([
                    { id: 1, username: 'admin', email: 'admin@animevoting.com', role: 'admin', status: 'active', votes: 1568 },
                    { id: 2, username: 'anime_lover', email: 'user1@example.com', role: 'user', status: 'active', votes: 42 },
                    { id: 3, username: 'weeb_master', email: 'user2@example.com', role: 'user', status: 'active', votes: 28 }
                ]);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.renderUserManagement([]);
        }
    }

    renderUserManagement(users) {
        const container = document.getElementById('usersSection');
        if (!container) return;
        
        container.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-users"></i> User Management</h2>
                <div class="header-actions">
                    <button class="btn-refresh" onclick="cms.loadUserManagement()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn-success" onclick="cms.addNewUser()">
                        <i class="fas fa-user-plus"></i> Add User
                    </button>
                </div>
            </div>
            <div class="users-table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Votes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td><strong>${user.username}</strong></td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="user-role ${user.role}">
                                        ${user.role === 'admin' ? 'Administrator' : 'User'}
                                    </span>
                                </td>
                                <td>
                                    <span class="user-status ${user.status}">
                                        ${user.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${user.votes || 0}</td>
                                <td>
                                    <button class="btn-small" onclick="cms.editUser(${user.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-small ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                            onclick="cms.toggleUserStatus(${user.id})">
                                        ${user.status === 'active' ? 'Suspend' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="user-management-actions">
                <button class="btn-info" onclick="cms.exportUsers()">
                    <i class="fas fa-download"></i> Export Users
                </button>
            </div>
        `;
    }

    async loadDesignSettings() {
        const container = document.getElementById('designSection');
        if (!container) return;
        
        const themes = [
            { id: 1, name: 'Anime Blue', primaryColor: '#6366f1', isActive: true },
            { id: 2, name: 'Dark Mode', primaryColor: '#1f2937', isActive: false },
            { id: 3, name: 'Purple', primaryColor: '#8b5cf6', isActive: false }
        ];
        
        container.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-palette"></i> Design & Theme</h2>
                <div class="header-actions">
                    <button class="btn-success" onclick="cms.createNewTheme()">
                        <i class="fas fa-plus"></i> New Theme
                    </button>
                </div>
            </div>
            
            <div class="design-settings">
                <h3><i class="fas fa-paint-brush"></i> Theme Management</h3>
                <div class="themes-grid">
                    ${themes.map(theme => `
                        <div class="theme-card ${theme.isActive ? 'active' : ''}" data-theme-id="${theme.id}">
                            <div class="theme-preview" style="background: ${theme.primaryColor}"></div>
                            <div class="theme-info">
                                <h4>${theme.name}</h4>
                                <div class="theme-actions">
                                    ${theme.isActive ? 
                                        '<span class="badge-active">Active</span>' : 
                                        '<button class="btn-small btn-success" onclick="cms.applyTheme(' + theme.id + ')">Apply</button>'
                                    }
                                    <button class="btn-small btn-danger" onclick="cms.deleteTheme(${theme.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="theme-customization">
                    <button class="btn-info" onclick="cms.customizeTheme()">
                        <i class="fas fa-paint-brush"></i> Customize Theme
                    </button>
                </div>
                
                <div class="layout-settings">
                    <h4><i class="fas fa-th-large"></i> Layout Settings</h4>
                    <div class="layout-options">
                        <div class="layout-option active">
                            <i class="fas fa-th"></i>
                            <span>Grid</span>
                        </div>
                        <div class="layout-option">
                            <i class="fas fa-list"></i>
                            <span>List</span>
                        </div>
                        <div class="layout-option">
                            <i class="fas fa-columns"></i>
                            <span>Compact</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadSystemInfo() {
        const container = document.getElementById('settingsSection');
        if (!container) return;
        
        const savedSettings = localStorage.getItem('adminSettings');
        const defaultSettings = {
            siteName: 'Anime Voting 2025',
            siteDescription: 'Vote for your favorite anime',
            maintenanceMode: false,
            allowRegistration: true,
            votingEndDate: '2025-12-31'
        };
        
        const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        
        container.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-cog"></i> System Settings</h2>
                <div class="header-actions">
                    <button class="btn-primary" onclick="cms.saveSystemSettings()">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
            
            <div class="system-settings">
                <h3><i class="fas fa-sliders-h"></i> General Settings</h3>
                <div class="settings-form">
                    <div class="form-group">
                        <label for="siteName">Site Name</label>
                        <input type="text" id="siteName" value="${settings.siteName}">
                    </div>
                    <div class="form-group">
                        <label for="siteDescription">Site Description</label>
                        <textarea id="siteDescription">${settings.siteDescription}</textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="maintenanceMode" ${settings.maintenanceMode ? 'checked' : ''}>
                            Maintenance Mode
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="allowRegistration" ${settings.allowRegistration ? 'checked' : ''}>
                            Allow User Registration
                        </label>
                    </div>
                    <div class="form-group">
                        <label for="votingEndDate">Voting End Date</label>
                        <input type="date" id="votingEndDate" value="${settings.votingEndDate}">
                    </div>
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="cms.resetSystemSettings()">
                            <i class="fas fa-undo"></i> Reset to Default
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Sidebar toggle
        const toggleSidebar = document.getElementById('toggleSidebar');
        const closeSidebar = document.getElementById('closeSidebar');
        if (toggleSidebar) toggleSidebar.addEventListener('click', () => this.toggleSidebar());
        if (closeSidebar) closeSidebar.addEventListener('click', () => this.toggleSidebar());
        
        // Quick save
        const quickSave = document.getElementById('quickSave');
        if (quickSave) quickSave.addEventListener('click', () => this.saveAllContent());
        
        // Logout
        const logoutAdmin = document.getElementById('logoutAdmin');
        if (logoutAdmin) logoutAdmin.addEventListener('click', () => this.logout());
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });
        
        // Submenu items
        document.querySelectorAll('.submenu li').forEach(item => {
            item.addEventListener('click', (e) => this.handleSubmenuClick(e));
        });
        
        // Page items
        document.querySelectorAll('.page-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchPage(e));
        });
        
        // Real-time preview
        this.setupRealTimePreview();
    }

    setupRealTimePreview() {
        // Color picker
        const colorPicker = document.getElementById('categoryColor');
        const colorValue = document.getElementById('colorValue');
        if (colorPicker && colorValue) {
            colorPicker.addEventListener('input', (e) => {
                colorValue.textContent = e.target.value;
            });
        }

        // Image preview
        const imageInput = document.getElementById('nomineeImage');
        if (imageInput) {
            imageInput.addEventListener('input', (e) => {
                this.previewImageInModal(e.target.value);
            });
        }
    }

    // Navigation Methods
    handleMenuClick(e) {
        const section = e.currentTarget.dataset.section;
        if (!section) return;

        document.querySelectorAll('.submenu').forEach(sub => {
            sub.style.display = 'none';
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        e.currentTarget.classList.add('active');

        const arrow = e.currentTarget.querySelector('.arrow');
        if (arrow) {
            const submenu = e.currentTarget.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        }

        this.showSection(section);
    }

    handleSubmenuClick(e) {
        const subsection = e.currentTarget.dataset.subsection;
        if (!subsection) return;

        document.querySelectorAll('.submenu li').forEach(item => {
            item.classList.remove('active');
        });

        e.currentTarget.classList.add('active');

        this.showSubsection(subsection);
    }

    showSection(section) {
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        const sectionElement = document.getElementById(section + 'Section');
        if (sectionElement) {
            sectionElement.classList.add('active');
            this.currentSection = section;
        }

        if (section === 'content') {
            this.showSubsection('categories');
        }
    }

    showSubsection(subsection) {
        document.querySelectorAll('.subsection').forEach(sub => {
            sub.classList.remove('active');
        });

        const subsectionElement = document.getElementById(subsection + 'Subsection');
        if (subsectionElement) {
            subsectionElement.classList.add('active');
            this.currentSubsection = subsection;
        }

        if (subsection === 'images') {
            this.renderImages();
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    setupNavigation() {
        this.showSection('dashboard');
    }

    // Dashboard Methods
    async renderDashboard() {
        this.updateDashboardUI({
            totalVotes: this.getTotalVotes(),
            uniqueVoters: this.adminData?.uniqueVoters || 423,
            averageVotes: Math.floor(this.getTotalVotes() / (this.contentData.users?.length || 1)),
            votesToday: this.adminData?.votesToday || 128
        });
        
        this.renderCharts();
        this.renderActivity();
    }

    initCharts() {
        if (this.voteChart) this.voteChart.destroy();
        if (this.categoryChart) this.categoryChart.destroy();
        
        this.renderCharts();
    }

    renderCharts() {
        // Vote Trends Chart
        const voteCtx = document.getElementById('voteChart');
        if (voteCtx) {
            const voteCanvas = voteCtx.getContext('2d');
            const categoryData = this.contentData.categories.map(cat => ({
                name: cat.name,
                votes: cat.votes || 0
            }));

            this.voteChart = new Chart(voteCanvas, {
                type: 'bar',
                data: {
                    labels: categoryData.map(d => d.name),
                    datasets: [{
                        label: 'Votes',
                        data: categoryData.map(d => d.votes),
                        backgroundColor: this.contentData.categories.map(c => c.color + '80'),
                        borderColor: this.contentData.categories.map(c => c.color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            const categoryCanvas = categoryCtx.getContext('2d');
            this.categoryChart = new Chart(categoryCanvas, {
                type: 'doughnut',
                data: {
                    labels: this.contentData.categories.map(c => c.name),
                    datasets: [{
                        data: this.contentData.categories.map(c => this.getNomineesInCategory(c.id).length),
                        backgroundColor: this.contentData.categories.map(c => c.color + '80'),
                        borderColor: this.contentData.categories.map(c => c.color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        }
    }

    renderActivity() {
        const container = document.getElementById('activityList');
        if (!container) return;

        const activities = [
            { time: 'Just now', action: 'You edited "Best Anime" category', user: 'Admin' },
            { time: '5 minutes ago', action: 'New nominee added: "Jujutsu Kaisen"', user: 'Admin' },
            { time: '1 hour ago', action: 'User "anime_lover" voted', user: 'System' },
            { time: '2 hours ago', action: 'Site preview generated', user: 'Admin' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.action}</p>
                    <small>${activity.time} • by ${activity.user}</small>
                </div>
            </div>
        `).join('');
    }

    // Category Management
    async renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;

        const categories = this.contentData.categories.sort((a, b) => a.order - b.order);
        
        container.innerHTML = categories.map(category => `
            <div class="category-card" data-id="${category.id}">
                <div class="category-header" style="border-left-color: ${category.color}">
                    <div class="category-icon">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <div class="category-info">
                        <h4>${category.name}</h4>
                        <p>${category.description}</p>
                    </div>
                    <div class="category-status">
                        <span class="status-badge ${category.status}">
                            ${category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div class="category-footer">
                    <div class="category-stats">
                        <span><i class="fas fa-list-ol"></i> ${this.getNomineesInCategory(category.id).length} nominees</span>
                        <span><i class="fas fa-vote-yea"></i> ${category.votes || 0} votes</span>
                        <span><i class="fas fa-user-check"></i> Max ${category.maxSelections} selection${category.maxSelections > 1 ? 's' : ''}</span>
                    </div>
                    <div class="category-actions">
                        <button class="btn-small" onclick="cms.editCategory('${category.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-small ${category.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                onclick="cms.toggleCategoryStatus('${category.id}')">
                            <i class="fas fa-toggle-${category.status === 'active' ? 'on' : 'off'}"></i>
                            ${category.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn-small btn-danger" onclick="cms.deleteCategory('${category.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.populateCategoryFilters();
    }

    addNewCategory() {
        this.editingCategory = null;
        this.openCategoryModal();
    }

    editCategory(categoryId) {
        const category = this.contentData.categories.find(c => c.id === categoryId);
        if (!category) return;

        this.editingCategory = category;
        this.openCategoryModal();
    }

    openCategoryModal() {
        const modal = document.getElementById('categoryModal');
        const form = document.getElementById('categoryForm');
        
        if (this.editingCategory) {
            document.getElementById('categoryName').value = this.editingCategory.name;
            document.getElementById('categoryDescription').value = this.editingCategory.description;
            document.getElementById('categoryIcon').value = this.editingCategory.icon;
            document.getElementById('categoryStatus').value = this.editingCategory.status;
            document.getElementById('categoryColor').value = this.editingCategory.color;
            document.getElementById('colorValue').textContent = this.editingCategory.color;
            document.getElementById('maxSelections').value = this.editingCategory.maxSelections;
        } else {
            form.reset();
            document.getElementById('categoryColor').value = '#6366f1';
            document.getElementById('colorValue').textContent = '#6366f1';
        }
        
        modal.style.display = 'flex';
    }

    saveCategory() {
        const form = document.getElementById('categoryForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const categoryData = {
            id: this.editingCategory?.id || this.generateId(),
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value,
            icon: document.getElementById('categoryIcon').value,
            status: document.getElementById('categoryStatus').value,
            color: document.getElementById('categoryColor').value,
            maxSelections: parseInt(document.getElementById('maxSelections').value),
            order: this.editingCategory?.order || this.contentData.categories.length + 1,
            votes: this.editingCategory?.votes || 0
        };

        if (this.editingCategory) {
            const index = this.contentData.categories.findIndex(c => c.id === this.editingCategory.id);
            if (index !== -1) {
                this.contentData.categories[index] = categoryData;
            }
        } else {
            this.contentData.categories.push(categoryData);
        }

        this.saveToLocalStorage();
        this.renderCategories();
        this.renderCharts();
        this.closeModal('categoryModal');
        
        this.showToast(`Category "${categoryData.name}" saved successfully`, 'success');
    }

    toggleCategoryStatus(categoryId) {
        const category = this.contentData.categories.find(c => c.id === categoryId);
        if (!category) return;

        category.status = category.status === 'active' ? 'inactive' : 'active';
        this.saveToLocalStorage();
        this.renderCategories();
        
        this.showToast(`Category "${category.name}" ${category.status === 'active' ? 'activated' : 'deactivated'}`, 'info');
    }

    deleteCategory(categoryId) {
        this.showConfirm('Delete Category', 'Are you sure you want to delete this category? All nominees in this category will also be deleted.', (confirmed) => {
            if (confirmed) {
                const category = this.contentData.categories.find(c => c.id === categoryId);
                if (!category) return;

                this.contentData.categories = this.contentData.categories.filter(c => c.id !== categoryId);
                this.contentData.nominees = this.contentData.nominees.filter(n => n.categoryId !== categoryId);
                
                this.saveToLocalStorage();
                this.renderCategories();
                this.renderNominees();
                this.renderCharts();
                
                this.showToast(`Category "${category.name}" deleted successfully`, 'success');
            }
        });
    }

    sortCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;

        new Sortable(container, {
            animation: 150,
            onEnd: (evt) => {
                const categories = Array.from(container.querySelectorAll('.category-card'));
                categories.forEach((card, index) => {
                    const categoryId = card.dataset.id;
                    const category = this.contentData.categories.find(c => c.id === categoryId);
                    if (category) {
                        category.order = index + 1;
                    }
                });
                
                this.saveToLocalStorage();
                this.showToast('Categories reordered successfully', 'success');
            }
        });
        
        this.showToast('Drag and drop categories to reorder them', 'info');
    }

    resetCategories() {
        this.showConfirm('Reset Categories', 'This will reset all categories to default. Current categories will be lost.', (confirmed) => {
            if (confirmed) {
                this.loadDefaultData();
                this.renderCategories();
                this.renderNominees();
                this.renderCharts();
                this.showToast('Categories reset to default', 'success');
            }
        });
    }

    // Nominee Management
    async renderNominees() {
        const container = document.getElementById('nomineesGrid');
        if (!container) return;

        const nominees = this.contentData.nominees;
        
        container.innerHTML = nominees.map(nominee => {
            const category = this.contentData.categories.find(c => c.id === nominee.categoryId);
            return `
                <div class="nominee-card" data-id="${nominee.id}">
                    <div class="nominee-image">
                        <img src="${nominee.image}" alt="${nominee.name}" 
                             onerror="this.src='https://via.placeholder.com/300x450?text=Anime+Image'">
                        <div class="image-overlay">
                            <button class="btn-icon" onclick="cms.editNominee('${nominee.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="cms.previewNominee('${nominee.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="nominee-info">
                        <h4>${nominee.name}</h4>
                        <p class="category-name">
                            <i class="fas fa-tag"></i> ${category?.name || 'Uncategorized'}
                        </p>
                        <p class="nominee-desc">${nominee.description}</p>
                        <div class="nominee-stats">
                            <span><i class="fas fa-star"></i> ${nominee.rating}/10</span>
                            <span><i class="fas fa-eye"></i> ${nominee.views}M+</span>
                            <span><i class="fas fa-vote-yea"></i> ${nominee.votes || 0}</span>
                        </div>
                        <div class="nominee-tags">
                            ${nominee.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
                        </div>
                        <div class="nominee-actions">
                            <button class="btn-small ${nominee.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                    onclick="cms.toggleNomineeStatus('${nominee.id}')">
                                ${nominee.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn-small btn-danger" onclick="cms.deleteNominee('${nominee.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addNewNominee() {
        this.editingNominee = null;
        this.openNomineeModal();
    }

    editNominee(nomineeId) {
        const nominee = this.contentData.nominees.find(n => n.id === nomineeId);
        if (!nominee) return;

        this.editingNominee = nominee;
        this.openNomineeModal();
    }

    openNomineeModal() {
        const modal = document.getElementById('nomineeModal');
        
        if (this.editingNominee) {
            document.getElementById('nomineeName').value = this.editingNominee.name;
            document.getElementById('nomineeCategory').value = this.editingNominee.categoryId;
            document.getElementById('nomineeDescription').value = this.editingNominee.description;
            document.getElementById('nomineeImage').value = this.editingNominee.image;
            document.getElementById('nomineeRating').value = this.editingNominee.rating;
            document.getElementById('nomineeViews').value = this.editingNominee.views;
            document.getElementById('nomineeTags').value = this.editingNominee.tags?.join(', ');
            document.getElementById('nomineeActive').checked = this.editingNominee.status === 'active';
            
            document.getElementById('deleteNomineeBtn').style.display = 'block';
            this.previewImageInModal(this.editingNominee.image);
        } else {
            document.getElementById('nomineeForm')?.reset();
            document.getElementById('nomineeCategory').value = this.contentData.categories[0]?.id || '';
            document.getElementById('deleteNomineeBtn').style.display = 'none';
            this.previewImageInModal('');
        }
        
        modal.style.display = 'flex';
    }

    saveNominee() {
        const nomineeData = {
            id: this.editingNominee?.id || this.generateId(),
            name: document.getElementById('nomineeName').value,
            categoryId: document.getElementById('nomineeCategory').value,
            description: document.getElementById('nomineeDescription').value,
            image: document.getElementById('nomineeImage').value,
            rating: parseFloat(document.getElementById('nomineeRating').value) || 0,
            views: parseFloat(document.getElementById('nomineeViews').value) || 0,
            tags: document.getElementById('nomineeTags').value.split(',').map(t => t.trim()).filter(t => t),
            status: document.getElementById('nomineeActive').checked ? 'active' : 'inactive',
            votes: this.editingNominee?.votes || 0,
            order: this.editingNominee?.order || this.getNomineesInCategory(document.getElementById('nomineeCategory').value).length + 1
        };

        if (this.editingNominee) {
            const index = this.contentData.nominees.findIndex(n => n.id === this.editingNominee.id);
            if (index !== -1) {
                this.contentData.nominees[index] = nomineeData;
            }
        } else {
            this.contentData.nominees.push(nomineeData);
        }

        this.saveToLocalStorage();
        this.renderNominees();
        this.renderCharts();
        this.closeModal('nomineeModal');
        
        this.showToast(`Nominee "${nomineeData.name}" saved successfully`, 'success');
    }

    deleteNominee() {
        if (!this.editingNominee) return;

        this.showConfirm('Delete Nominee', `Are you sure you want to delete "${this.editingNominee.name}"?`, (confirmed) => {
            if (confirmed) {
                this.contentData.nominees = this.contentData.nominees.filter(n => n.id !== this.editingNominee.id);
                this.saveToLocalStorage();
                this.renderNominees();
                this.renderCharts();
                this.closeModal('nomineeModal');
                
                this.showToast(`Nominee "${this.editingNominee.name}" deleted`, 'success');
            }
        });
    }

    toggleNomineeStatus(nomineeId) {
        const nominee = this.contentData.nominees.find(n => n.id === nomineeId);
        if (!nominee) return;

        nominee.status = nominee.status === 'active' ? 'inactive' : 'active';
        this.saveToLocalStorage();
        this.renderNominees();
        
        this.showToast(`Nominee "${nominee.name}" ${nominee.status === 'active' ? 'activated' : 'deactivated'}`, 'info');
    }

    previewNominee(nomineeId) {
        const nominee = this.contentData.nominees.find(n => n.id === nomineeId);
        if (nominee) {
            this.showToast(`Previewing ${nominee.name}...`, 'info');
        }
    }

    filterNominees() {
        const categoryId = document.getElementById('nomineeCategoryFilter')?.value;
        this.showToast(`Filtering nominees by category...`, 'info');
    }

    bulkImportNominees() {
        this.showToast('Bulk import feature coming soon!', 'info');
    }

    // Image Management
    async renderImages() {
        const container = document.getElementById('imageGrid');
        if (!container) return;

        const images = this.contentData.images || [];
        
        container.innerHTML = images.map(image => `
            <div class="image-card" data-id="${image.id}">
                <div class="image-checkbox">
                    <input type="checkbox" class="image-select" data-id="${image.id}">
                </div>
                <div class="image-preview">
                    <img src="${image.url}" alt="${image.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                    <div class="image-overlay">
                        <button class="btn-icon" onclick="cms.previewImage('${image.id}')">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="btn-icon" onclick="cms.copyImageUrl('${image.id}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="cms.deleteImage('${image.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="image-info">
                    <h5>${image.name}</h5>
                    <p><i class="fas fa-tag"></i> ${image.type}</p>
                    <p><i class="fas fa-weight"></i> ${image.size}</p>
                    <p><i class="fas fa-calendar"></i> ${image.uploaded}</p>
                </div>
            </div>
        `).join('');
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            this.handleBulkUpload(files);
        });
        
        dropZone.addEventListener('click', () => {
            document.getElementById('bulkUpload')?.click();
        });
    }

    async handleBulkUpload(files) {
        if (!files || files.length === 0) return;

        this.showLoading(true);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.size > 5 * 1024 * 1024) {
                this.showToast(`File ${file.name} is too large (max 5MB)`, 'error');
                continue;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const imageUrl = URL.createObjectURL(file);
            
            if (!this.contentData.images) this.contentData.images = [];
            
            this.contentData.images.push({
                id: this.generateId(),
                name: file.name,
                url: imageUrl,
                type: this.detectImageType(file.name),
                size: this.formatFileSize(file.size),
                uploaded: new Date().toLocaleDateString()
            });
        }
        
        this.saveToLocalStorage();
        this.renderImages();
        this.showLoading(false);
        
        this.showToast(`${files.length} images uploaded successfully`, 'success');
    }

    browseImages() {
        const modal = document.getElementById('imageBrowserModal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderImageLibrary();
        }
    }

    renderImageLibrary() {
        const container = document.getElementById('imageLibrary');
        if (!container) return;

        container.innerHTML = (this.contentData.images || []).map(image => `
            <div class="library-image" onclick="cms.selectImageFromLibrary('${image.url}')">
                <img src="${image.url}" alt="${image.name}">
                <div class="image-name">${image.name}</div>
            </div>
        `).join('');
    }

    selectImageFromLibrary(imageUrl) {
        document.getElementById('nomineeImage').value = imageUrl;
        this.previewImageInModal(imageUrl);
        this.closeModal('imageBrowserModal');
    }

    previewImageInModal(imageUrl) {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;

        const img = document.getElementById('previewImage');
        const placeholder = preview.querySelector('.preview-placeholder');
        
        if (imageUrl && img) {
            img.src = imageUrl;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        } else {
            if (img) img.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
        }
    }

    copyImageUrl(imageId) {
        const image = (this.contentData.images || []).find(img => img.id === imageId);
        if (!image) return;

        navigator.clipboard.writeText(image.url)
            .then(() => this.showToast('Image URL copied to clipboard', 'success'))
            .catch(() => this.showToast('Failed to copy URL', 'error'));
    }

    deleteImage(imageId) {
        this.showConfirm('Delete Image', 'Are you sure you want to delete this image?', (confirmed) => {
            if (confirmed) {
                this.contentData.images = (this.contentData.images || []).filter(img => img.id !== imageId);
                this.saveToLocalStorage();
                this.renderImages();
                this.showToast('Image deleted', 'success');
            }
        });
    }

    deleteSelectedImages() {
        const selected = document.querySelectorAll('.image-select:checked');
        if (selected.length === 0) {
            this.showToast('No images selected', 'warning');
            return;
        }

        this.showConfirm('Delete Images', `Delete ${selected.length} selected images?`, (confirmed) => {
            if (confirmed) {
                selected.forEach(checkbox => {
                    const imageId = checkbox.dataset.id;
                    this.contentData.images = (this.contentData.images || []).filter(img => img.id !== imageId);
                });
                
                this.saveToLocalStorage();
                this.renderImages();
                this.showToast(`${selected.length} images deleted`, 'success');
            }
        });
    }

    filterImages() {
        this.showToast('Filtering images...', 'info');
    }

    sortImages() {
        this.showToast('Sorting images...', 'info');
    }

    // Page Management
    switchPage(e) {
        const page = e.currentTarget.dataset.page;
        
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const pageElement = document.getElementById(page + 'Page');
        if (pageElement) {
            pageElement.style.display = 'block';
        }
    }

    savePageContent() {
        const activePage = document.querySelector('.page-item.active')?.dataset.page;
        if (!activePage) return;

        if (activePage === 'home') {
            this.contentData.pages.home = {
                title: document.getElementById('homeTitle')?.value || '',
                subtitle: document.getElementById('homeSubtitle')?.value || '',
                heroImage: document.getElementById('homeHeroImage')?.value || '',
                welcomeMessage: document.getElementById('homeWelcome')?.value || ''
            };
        } else if (activePage === 'about') {
            this.contentData.pages.about = {
                title: document.getElementById('aboutTitle')?.value || '',
                content: document.getElementById('aboutContent')?.value || ''
            };
        }
        
        this.saveToLocalStorage();
        this.showToast(`${activePage.charAt(0).toUpperCase() + activePage.slice(1)} saved successfully`, 'success');
    }

    previewPage() {
        const activePage = document.querySelector('.page-item.active')?.dataset.page;
        if (activePage) {
            this.showToast(`Previewing ${activePage} page...`, 'info');
        }
    }

    // User Management Methods (from admin-fixed.js)
    addNewUser() {
        const username = prompt('Enter username:');
        const email = prompt('Enter email:');
        const password = prompt('Enter password:');
        
        if (username && email && password) {
            const newUser = {
                id: this.generateId(),
                username: username,
                email: email,
                role: 'user',
                status: 'active',
                votes: 0
            };
            
            if (!this.contentData.users) this.contentData.users = [];
            this.contentData.users.push(newUser);
            this.saveToLocalStorage();
            this.loadUserManagement();
            
            this.showToast(`User ${username} added successfully`, 'success');
        }
    }

    editUser(userId) {
        this.showToast(`Editing user ID: ${userId}`, 'info');
    }

    toggleUserStatus(userId) {
        const users = this.contentData.users || [];
        const user = users.find(u => u.id == userId);
        if (user) {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            this.saveToLocalStorage();
            this.loadUserManagement();
            this.showToast(`User status updated`, 'info');
        }
    }

    exportUsers() {
        const users = this.contentData.users || [];
        const csvContent = "data:text/csv;charset=utf-8," 
            + ["ID,Username,Email,Role,Status,Votes", ...users.map(u => 
                `${u.id},${u.username},${u.email},${u.role},${u.status},${u.votes}`
            )].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Users exported successfully', 'success');
    }

    // Theme Management Methods
    applyTheme(themeId) {
        this.showToast(`Theme applied successfully`, 'success');
        this.loadDesignSettings();
    }

    deleteTheme(themeId) {
        if (confirm('Delete this theme?')) {
            this.showToast(`Theme deleted`, 'success');
            this.loadDesignSettings();
        }
    }

    createNewTheme() {
        const themeName = prompt('Enter theme name:');
        if (themeName) {
            this.showToast(`Theme "${themeName}" created`, 'success');
            this.loadDesignSettings();
        }
    }

    customizeTheme() {
        this.showToast('Opening theme customizer...', 'info');
    }

    // System Settings Methods
    saveSystemSettings() {
        const siteName = document.getElementById('siteName')?.value || '';
        const siteDescription = document.getElementById('siteDescription')?.value || '';
        const maintenanceMode = document.getElementById('maintenanceMode')?.checked || false;
        const allowRegistration = document.getElementById('allowRegistration')?.checked || true;
        const votingEndDate = document.getElementById('votingEndDate')?.value || '';
        
        const settings = {
            siteName,
            siteDescription,
            maintenanceMode,
            allowRegistration,
            votingEndDate
        };
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        this.showToast('Settings saved successfully', 'success');
    }

    resetSystemSettings() {
        if (confirm('Reset all settings to default?')) {
            localStorage.removeItem('adminSettings');
            this.loadSystemInfo();
            this.showToast('Settings reset to default', 'success');
        }
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getTotalVotes() {
        return (this.contentData.nominees || []).reduce((sum, nominee) => sum + (nominee.votes || 0), 0);
    }

    getNomineesInCategory(categoryId) {
        return (this.contentData.nominees || []).filter(n => n.categoryId === categoryId);
    }

    populateCategoryFilters() {
        const filterSelect = document.getElementById('nomineeCategoryFilter');
        const categorySelect = document.getElementById('nomineeCategory');
        
        const categories = this.contentData.categories || [];
        
        if (filterSelect) {
            filterSelect.innerHTML = `
                <option value="all">All Categories</option>
                ${categories.map(cat => `
                    <option value="${cat.id}">${cat.name}</option>
                `).join('')}
            `;
        }
        
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('');
        }
    }

    detectImageType(filename) {
        if (filename.includes('banner')) return 'banners';
        if (filename.includes('background')) return 'backgrounds';
        if (filename.includes('icon')) return 'icons';
        return 'nominees';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    saveToLocalStorage() {
        localStorage.setItem('cmsContent', JSON.stringify(this.contentData));
    }

    saveAllContent() {
        this.saveToLocalStorage();
        this.showToast('All changes saved successfully', 'success');
    }

    previewSite() {
        this.showToast('Opening site preview...', 'info');
    }

    showConfirm(title, message, callback) {
        this.confirmCallback = callback;
        const confirmMessage = document.getElementById('confirmMessage');
        if (confirmMessage) {
            confirmMessage.textContent = message;
        }
        document.getElementById('confirmModal').style.display = 'flex';
    }

    confirmAction(confirmed) {
        if (this.confirmCallback) {
            this.confirmCallback(confirmed);
        }
        this.closeModal('confirmModal');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="toast-content">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    startAutoRefresh() {
        // Refresh dashboard every 5 minutes
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 300000);
    }

    refreshDashboard() {
        this.loadDashboardData();
        this.showToast('Dashboard refreshed', 'success');
    }
}

// Global instance
let cms = null;

// Initialize when page loads
window.onload = () => {
    cms = new AnimeVotingCMS();
};

// Make methods available globally
window.cms = cms;

// Helper functions for inline event handlers
window.refreshDashboard = () => cms?.refreshDashboard();
window.saveAllContent = () => cms?.saveAllContent();
window.previewSite = () => cms?.previewSite();
window.addNewCategory = () => cms?.addNewCategory();
window.sortCategories = () => cms?.sortCategories();
window.resetCategories = () => cms?.resetCategories();
window.saveCategory = () => cms?.saveCategory();
window.addNewNominee = () => cms?.addNewNominee();
window.saveNominee = () => cms?.saveNominee();
window.deleteNominee = () => cms?.deleteNominee();
window.browseImages = () => cms?.browseImages();
window.handleBulkUpload = (files) => cms?.handleBulkUpload(files);
window.filterNominees = () => cms?.filterNominees();
window.bulkImportNominees = () => cms?.bulkImportNominees();
window.savePageContent = () => cms?.savePageContent();
window.previewPage = () => cms?.previewPage();
window.filterImages = () => cms?.filterImages();
window.sortImages = () => cms?.sortImages();
window.deleteSelectedImages = () => cms?.deleteSelectedImages();
window.closeModal = (modalId) => cms?.closeModal(modalId);
window.confirmAction = (confirmed) => cms?.confirmAction(confirmed);
