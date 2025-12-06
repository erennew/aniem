// Anime Voting CMS - Complete Content Management System
class AnimeVotingCMS {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentSubsection = null;
        this.editingCategory = null;
        this.editingNominee = null;
        this.confirmCallback = null;
        this.contentData = {
            categories: [],
            nominees: [],
            images: [],
            pages: {},
            settings: {}
        };
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        await this.loadAllData();
        this.setupNavigation();
        this.setupDragAndDrop();
        this.showToast('CMS initialized successfully', 'success');
    }

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'login.html';
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('toggleSidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleSidebar());
        
        // Quick save
        document.getElementById('quickSave').addEventListener('click', () => this.saveAllContent());
        
        // Logout
        document.getElementById('logoutAdmin').addEventListener('click', () => this.logout());
        
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
        
        // Real-time preview for form inputs
        this.setupRealTimePreview();
    }

    async loadAllData() {
        this.showLoading(true);
        
        try {
            // Load from localStorage or API
            const savedData = localStorage.getItem('cmsContent');
            if (savedData) {
                this.contentData = JSON.parse(savedData);
            } else {
                await this.loadDefaultData();
            }
            
            // Render initial content
            await this.renderDashboard();
            await this.renderCategories();
            await this.renderNominees();
            await this.renderImages();
            
            this.showLoading(false);
            this.showToast('Data loaded successfully', 'success');
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('Failed to load data', 'error');
            this.showLoading(false);
        }
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
                order: 1
            },
            {
                id: 'cat2',
                name: 'Best Animation Studio',
                description: 'Which studio delivered the most impressive visual experience?',
                icon: 'fa-palette',
                color: '#10b981',
                status: 'active',
                maxSelections: 1,
                order: 2
            },
            {
                id: 'cat3',
                name: 'Best Voice Actor of 2025',
                description: 'Recognize outstanding voice acting performances',
                icon: 'fa-microphone',
                color: '#f59e0b',
                status: 'active',
                maxSelections: 1,
                order: 3
            },
            {
                id: 'cat4',
                name: 'Most Anticipated Anime of 2025',
                description: 'Which upcoming anime are you most excited about?',
                icon: 'fa-calendar-star',
                color: '#ef4444',
                status: 'active',
                maxSelections: 1,
                order: 4
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
            },
            {
                id: 'nom3',
                name: 'Demon Slayer: Mugen Train',
                categoryId: 'cat1',
                description: 'Continuing the epic journey with breathtaking animation quality.',
                image: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                rating: 9.3,
                views: 2.3,
                tags: ['action', 'fantasy', 'adventure'],
                status: 'active',
                votes: 342,
                order: 3
            }
        ];

        // Default images
        this.contentData.images = [
            {
                id: 'img1',
                name: 'Attack on Titan',
                url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                type: 'nominee',
                size: '450KB',
                uploaded: '2024-01-15'
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

    async renderDashboard() {
        // Update stats
        document.getElementById('totalVotes').textContent = this.getTotalVotes().toLocaleString();
        document.getElementById('activeUsers').textContent = '423';
        document.getElementById('totalCategories').textContent = this.contentData.categories.length;
        document.getElementById('totalNominees').textContent = this.contentData.nominees.length;

        // Render charts
        this.renderCharts();

        // Render recent activity
        this.renderActivity();
    }

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
                        <span><i class="fas fa-vote-yea"></i> ${this.getCategoryVotes(category.id)} votes</span>
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

        // Populate category filters
        this.populateCategoryFilters();
    }

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

    async renderImages() {
        const container = document.getElementById('imageGrid');
        if (!container) return;

        const images = this.contentData.images;
        
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

    renderCharts() {
        // Destroy existing charts
        if (this.voteChart) this.voteChart.destroy();
        if (this.categoryChart) this.categoryChart.destroy();

        // Vote Trends Chart
        const voteCtx = document.getElementById('voteChart').getContext('2d');
        const categoryData = this.contentData.categories.map(cat => ({
            name: cat.name,
            votes: this.getCategoryVotes(cat.id)
        }));

        this.voteChart = new Chart(voteCtx, {
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

        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        this.categoryChart = new Chart(categoryCtx, {
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

    renderActivity() {
        const container = document.getElementById('activityList');
        if (!container) return;

        const activities = [
            { time: 'Just now', action: 'You edited "Best Anime" category', user: 'Admin' },
            { time: '5 minutes ago', action: 'New nominee added: "Chainsaw Man"', user: 'Admin' },
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

    populateCategoryFilters() {
        // Populate category filter in nominees section
        const filterSelect = document.getElementById('nomineeCategoryFilter');
        const categorySelect = document.getElementById('nomineeCategory');
        
        if (filterSelect) {
            filterSelect.innerHTML = `
                <option value="all">All Categories</option>
                ${this.contentData.categories.map(cat => `
                    <option value="${cat.id}">${cat.name}</option>
                `).join('')}
            `;
        }
        
        if (categorySelect) {
            categorySelect.innerHTML = this.contentData.categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('');
        }
    }

    // Category Management
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
            // Fill form with existing data
            document.getElementById('categoryName').value = this.editingCategory.name;
            document.getElementById('categoryDescription').value = this.editingCategory.description;
            document.getElementById('categoryIcon').value = this.editingCategory.icon;
            document.getElementById('categoryStatus').value = this.editingCategory.status;
            document.getElementById('categoryColor').value = this.editingCategory.color;
            document.getElementById('colorValue').textContent = this.editingCategory.color;
            document.getElementById('maxSelections').value = this.editingCategory.maxSelections;
        } else {
            // Reset form for new category
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
            // Update existing category
            const index = this.contentData.categories.findIndex(c => c.id === this.editingCategory.id);
            if (index !== -1) {
                this.contentData.categories[index] = categoryData;
            }
        } else {
            // Add new category
            this.contentData.categories.push(categoryData);
        }

        this.saveToLocalStorage();
        this.renderCategories();
        this.renderCharts();
        this.closeModal('categoryModal');
        
        this.showToast(`Category "${categoryData.name}" saved successfully`, 'success');
        
        // Log activity
        this.logActivity(this.editingCategory ? 'edited' : 'added', 'category', categoryData.name);
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

                // Delete category
                this.contentData.categories = this.contentData.categories.filter(c => c.id !== categoryId);
                
                // Delete nominees in this category
                this.contentData.nominees = this.contentData.nominees.filter(n => n.categoryId !== categoryId);
                
                this.saveToLocalStorage();
                this.renderCategories();
                this.renderNominees();
                this.renderCharts();
                
                this.showToast(`Category "${category.name}" deleted successfully`, 'success');
                this.logActivity('deleted', 'category', category.name);
            }
        });
    }

    sortCategories() {
        // Make categories sortable
        const container = document.getElementById('categoriesList');
        new Sortable(container, {
            animation: 150,
            onEnd: (evt) => {
                // Update order in data
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
            // Fill form with existing data
            document.getElementById('nomineeName').value = this.editingNominee.name;
            document.getElementById('nomineeCategory').value = this.editingNominee.categoryId;
            document.getElementById('nomineeDescription').value = this.editingNominee.description;
            document.getElementById('nomineeImage').value = this.editingNominee.image;
            document.getElementById('nomineeRating').value = this.editingNominee.rating;
            document.getElementById('nomineeViews').value = this.editingNominee.views;
            document.getElementById('nomineeTags').value = this.editingNominee.tags?.join(', ');
            document.getElementById('nomineeActive').checked = this.editingNominee.status === 'active';
            
            // Show delete button
            document.getElementById('deleteNomineeBtn').style.display = 'block';
            
            // Preview image
            this.previewImageInModal(this.editingNominee.image);
        } else {
            // Reset form for new nominee
            document.getElementById('nomineeForm').reset();
            document.getElementById('nomineeCategory').value = this.contentData.categories[0]?.id || '';
            document.getElementById('deleteNomineeBtn').style.display = 'none';
            
            // Clear preview
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
            // Update existing nominee
            const index = this.contentData.nominees.findIndex(n => n.id === this.editingNominee.id);
            if (index !== -1) {
                this.contentData.nominees[index] = nomineeData;
            }
        } else {
            // Add new nominee
            this.contentData.nominees.push(nomineeData);
        }

        this.saveToLocalStorage();
        this.renderNominees();
        this.renderCharts();
        this.closeModal('nomineeModal');
        
        this.showToast(`Nominee "${nomineeData.name}" saved successfully`, 'success');
        this.logActivity(this.editingNominee ? 'edited' : 'added', 'nominee', nomineeData.name);
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
                this.logActivity('deleted', 'nominee', this.editingNominee.name);
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

    filterNominees() {
        const categoryId = document.getElementById('nomineeCategoryFilter').value;
        const nominees = categoryId === 'all' 
            ? this.contentData.nominees 
            : this.contentData.nominees.filter(n => n.categoryId === categoryId);
        
        // Re-render nominees grid with filtered data
        const container = document.getElementById('nomineesGrid');
        // Similar to renderNominees but with filtered data
    }

    bulkImportNominees() {
        this.showToast('Bulk import feature coming soon!', 'info');
    }

    // Image Management
    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        
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
            document.getElementById('bulkUpload').click();
        });
    }

    async handleBulkUpload(files) {
        if (!files || files.length === 0) return;

        this.showLoading(true);
        
        // Simulate upload process
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showToast(`File ${file.name} is too large (max 5MB)`, 'error');
                continue;
            }
            
            // Simulate upload to server
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Create object URL for preview (in real app, this would be server URL)
            const imageUrl = URL.createObjectURL(file);
            
            // Add to images array
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
        this.logActivity('uploaded', 'images', `${files.length} files`);
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

    browseImages() {
        const modal = document.getElementById('imageBrowserModal');
        modal.style.display = 'flex';
        
        // Load images in library
        this.renderImageLibrary();
    }

    renderImageLibrary() {
        const container = document.getElementById('imageLibrary');
        if (!container) return;

        container.innerHTML = this.contentData.images.map(image => `
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
        const img = document.getElementById('previewImage');
        const placeholder = preview.querySelector('.preview-placeholder');
        
        if (imageUrl) {
            img.src = imageUrl;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    }

    copyImageUrl(imageId) {
        const image = this.contentData.images.find(img => img.id === imageId);
        if (!image) return;

        navigator.clipboard.writeText(image.url)
            .then(() => this.showToast('Image URL copied to clipboard', 'success'))
            .catch(() => this.showToast('Failed to copy URL', 'error'));
    }

    deleteImage(imageId) {
        this.showConfirm('Delete Image', 'Are you sure you want to delete this image?', (confirmed) => {
            if (confirmed) {
                this.contentData.images = this.contentData.images.filter(img => img.id !== imageId);
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
                    this.contentData.images = this.contentData.images.filter(img => img.id !== imageId);
                });
                
                this.saveToLocalStorage();
                this.renderImages();
                this.showToast(`${selected.length} images deleted`, 'success');
            }
        });
    }

    // Page Content Management
    switchPage(e) {
        const page = e.currentTarget.dataset.page;
        
        // Update active page
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // Show corresponding page section
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(page + 'Page').style.display = 'block';
    }

    savePageContent() {
        const activePage = document.querySelector('.page-item.active').dataset.page;
        
        // Save content based on active page
        if (activePage === 'home') {
            this.contentData.pages.home = {
                title: document.getElementById('homeTitle').value,
                subtitle: document.getElementById('homeSubtitle').value,
                heroImage: document.getElementById('homeHeroImage').value,
                welcomeMessage: document.getElementById('homeWelcome').value
            };
        } else if (activePage === 'about') {
            this.contentData.pages.about = {
                title: document.getElementById('aboutTitle').value,
                content: document.getElementById('aboutContent').value
            };
        }
        
        this.saveToLocalStorage();
        this.showToast(`${activePage.charAt(0).toUpperCase() + activePage.slice(1)} saved successfully`, 'success');
    }

    previewPage() {
        const activePage = document.querySelector('.page-item.active').dataset.page;
        this.showToast(`Previewing ${activePage} page...`, 'info');
        // In a real app, this would open a preview window
    }

    // Navigation
    handleMenuClick(e) {
        const section = e.currentTarget.dataset.section;
        if (!section) return;

        // Close all submenus first
        document.querySelectorAll('.submenu').forEach(sub => {
            sub.style.display = 'none';
        });

        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        e.currentTarget.classList.add('active');

        // Show submenu if it has one
        const arrow = e.currentTarget.querySelector('.arrow');
        if (arrow) {
            const submenu = e.currentTarget.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        }

        // Show corresponding section
        this.showSection(section);
    }

    handleSubmenuClick(e) {
        const subsection = e.currentTarget.dataset.subsection;
        if (!subsection) return;

        // Remove active class from all submenu items
        document.querySelectorAll('.submenu li').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        e.currentTarget.classList.add('active');

        // Show corresponding subsection
        this.showSubsection(subsection);
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        document.getElementById(section + 'Section').classList.add('active');
        this.currentSection = section;

        // If section has subsections, show the first one
        if (section === 'content') {
            this.showSubsection('categories');
        }
    }

    showSubsection(subsection) {
        // Hide all subsections
        document.querySelectorAll('.subsection').forEach(sub => {
            sub.classList.remove('active');
        });

        // Show selected subsection
        document.getElementById(subsection + 'Subsection').classList.add('active');
        this.currentSubsection = subsection;

        // Load data if needed
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
        // Set up initial navigation
        this.showSection('dashboard');
    }

    setupRealTimePreview() {
        // Real-time preview for color picker
        const colorPicker = document.getElementById('categoryColor');
        const colorValue = document.getElementById('colorValue');
        
        if (colorPicker && colorValue) {
            colorPicker.addEventListener('input', (e) => {
                colorValue.textContent = e.target.value;
            });
        }

        // Real-time image preview
        const imageInput = document.getElementById('nomineeImage');
        if (imageInput) {
            imageInput.addEventListener('input', (e) => {
                this.previewImageInModal(e.target.value);
            });
        }
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getTotalVotes() {
        return this.contentData.nominees.reduce((sum, nominee) => sum + (nominee.votes || 0), 0);
    }

    getNomineesInCategory(categoryId) {
        return this.contentData.nominees.filter(n => n.categoryId === categoryId);
    }

    getCategoryVotes(categoryId) {
        return this.getNomineesInCategory(categoryId).reduce((sum, nominee) => sum + (nominee.votes || 0), 0);
    }

    saveToLocalStorage() {
        localStorage.setItem('cmsContent', JSON.stringify(this.contentData));
    }

    saveAllContent() {
        this.saveToLocalStorage();
        this.showToast('All changes saved successfully', 'success');
    }

    logActivity(action, type, item) {
        // In a real app, this would send to server
        console.log(`Activity: ${action} ${type} "${item}"`);
    }

    previewSite() {
        this.showToast('Opening site preview...', 'info');
        // In a real app, this would generate and open a preview
    }

    showConfirm(title, message, callback) {
        this.confirmCallback = callback;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
    }

    confirmAction(confirmed) {
        if (this.confirmCallback) {
            this.confirmCallback(confirmed);
        }
        this.closeModal('confirmModal');
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
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
        
        // Remove toast after 5 seconds
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
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }

    refreshDashboard() {
        this.renderDashboard();
        this.showToast('Dashboard refreshed', 'success');
    }
}

// Initialize CMS when page loads
let cms;
window.onload = () => {
    cms = new AnimeVotingCMS();
};

// Make cms methods available globally
window.cms = cms;