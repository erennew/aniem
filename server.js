const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://aniem-seven.vercel.app',
            'https://aniem-7mjyn9to7-erennews-projects.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// IMPORTANT: NEVER hardcode MongoDB credentials in code
// Use environment variables instead
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set!');
    // Use a fallback for development only
    console.log('Using in-memory data (no database) for demo');
}

// Schemas
const VoteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userIdentifier: { type: String, required: true }, // Browser fingerprint + IP hash
    category: { type: String, required: true },
    selection: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
});

// Admin User Schema
const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// CMS Schemas
const CategorySchema = new mongoose.Schema({
    name: String,
    description: String,
    icon: String,
    color: String,
    status: String,
    order: Number
});

const NomineeSchema = new mongoose.Schema({
    name: String,
    categoryId: String,
    description: String,
    image: String,
    rating: Number,
    views: Number,
    tags: [String],
    status: String,
    votes: Number
});

// Create models
const Vote = mongoose.model('Vote', VoteSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const Category = mongoose.model('Category', CategorySchema);
const Nominee = mongoose.model('Nominee', NomineeSchema);

// In-memory data storage for demo (if MongoDB fails)
let demoData = {
    categories: [
        {
            _id: 'cat1',
            name: 'Best Anime of 2025',
            description: 'Select the anime that impressed you the most this year!',
            icon: 'fa-crown',
            color: '#6366f1',
            status: 'active',
            order: 1
        },
        {
            _id: 'cat2',
            name: 'Best Animation Studio',
            description: 'Which studio delivered the most impressive visual experience?',
            icon: 'fa-palette',
            color: '#10b981',
            status: 'active',
            order: 2
        },
        {
            _id: 'cat3',
            name: 'Best Voice Actor of 2025',
            description: 'Recognize outstanding voice acting performances',
            icon: 'fa-microphone',
            color: '#f59e0b',
            status: 'active',
            order: 3
        },
        {
            _id: 'cat4',
            name: 'Most Anticipated Anime of 2025',
            description: 'Which upcoming anime are you most excited about?',
            icon: 'fa-calendar-star',
            color: '#ef4444',
            status: 'active',
            order: 4
        }
    ],
    nominees: [],
    votes: [],
    admins: []
};

// Connect to MongoDB if URI exists
let dbConnected = false;
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Connected to MongoDB');
        dbConnected = true;
        
        // Create default admin if not exists
        createDefaultAdmin();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Using demo mode with in-memory data');
    });
} else {
    console.log('No MongoDB URI provided, using demo mode');
}

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new Admin({
                username: 'admin',
                password: hashedPassword,
                isAdmin: true
            });
            await admin.save();
            console.log('Default admin user created');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Helper function to generate unique user identifier (IP + User-Agent hash)
function generateUserIdentifier(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const identifier = crypto.createHash('md5').update(ip + userAgent).digest('hex');
    return identifier;
}

// Authentication middleware (for admin only)
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        req.user = user;
        next();
    });
};

// ==================== PUBLIC ROUTES ====================

// Serve main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'demo-mode'
    });
});

// Get Categories (Public)
app.get('/api/categories', async (req, res) => {
    try {
        let categories;
        if (dbConnected) {
            categories = await Category.find().sort('order');
        } else {
            categories = demoData.categories;
        }
        
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get Nominees (Public)
app.get('/api/nominees', async (req, res) => {
    try {
        let nominees;
        if (dbConnected) {
            nominees = await Nominee.find();
        } else {
            nominees = demoData.nominees;
        }
        
        res.json(nominees);
    } catch (error) {
        console.error('Error fetching nominees:', error);
        res.status(500).json({ error: 'Failed to fetch nominees' });
    }
});

// ==================== VOTING ROUTES (NO LOGIN REQUIRED) ====================

// Submit Vote (No authentication required)
app.post('/api/vote', async (req, res) => {
    try {
        const { category, selection, userName } = req.body;
        
        if (!category || !selection) {
            return res.status(400).json({ error: 'Category and selection required' });
        }
        
        // Generate unique identifier for this user
        const userIdentifier = generateUserIdentifier(req);
        
        // Check if already voted in this category using userIdentifier
        let existingVote;
        if (dbConnected) {
            existingVote = await Vote.findOne({ 
                userIdentifier, 
                category 
            });
        } else {
            existingVote = demoData.votes.find(v => 
                v.userIdentifier === userIdentifier && v.category === category
            );
        }
        
        if (existingVote) {
            return res.status(400).json({ 
                error: 'You have already voted in this category. Each user can only vote once per category.' 
            });
        }
        
        // Create vote
        const voteData = {
            userId: userName || `user_${Date.now()}`,
            userIdentifier,
            category,
            selection,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        if (dbConnected) {
            const vote = new Vote(voteData);
            await vote.save();
            
            // Update nominee vote count
            await Nominee.findOneAndUpdate(
                { name: selection },
                { $inc: { votes: 1 } },
                { upsert: true }
            );
        } else {
            demoData.votes.push({
                id: 'vote_' + Date.now(),
                ...voteData
            });
            
            // Update demo nominee votes
            const nomineeIndex = demoData.nominees.findIndex(n => n.name === selection);
            if (nomineeIndex !== -1) {
                demoData.nominees[nomineeIndex].votes = (demoData.nominees[nomineeIndex].votes || 0) + 1;
            }
        }
        
        res.json({ 
            success: true,
            message: 'Vote submitted successfully! Thank you for voting.' 
        });
    } catch (error) {
        console.error('Voting error:', error);
        res.status(500).json({ error: 'Voting failed. Please try again.' });
    }
});

// Check if user can vote (by IP/User-Agent)
app.post('/api/check-vote', async (req, res) => {
    try {
        const { category } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category required' });
        }
        
        const userIdentifier = generateUserIdentifier(req);
        
        let existingVote;
        if (dbConnected) {
            existingVote = await Vote.findOne({ 
                userIdentifier, 
                category 
            });
        } else {
            existingVote = demoData.votes.find(v => 
                v.userIdentifier === userIdentifier && v.category === category
            );
        }
        
        res.json({
            canVote: !existingVote,
            hasVoted: !!existingVote,
            existingVote: existingVote ? {
                selection: existingVote.selection,
                timestamp: existingVote.timestamp
            } : null
        });
    } catch (error) {
        console.error('Check vote error:', error);
        res.status(500).json({ error: 'Failed to check vote status' });
    }
});

// Get Vote Results (Public)
app.get('/api/results', async (req, res) => {
    try {
        let votes;
        if (dbConnected) {
            votes = await Vote.find();
        } else {
            votes = demoData.votes;
        }
        
        // Get all unique categories from votes
        const categories = [...new Set(votes.map(v => v.category))];
        
        const results = {};
        categories.forEach(category => {
            const categoryVotes = votes.filter(v => v.category === category);
            const counts = {};
            
            categoryVotes.forEach(vote => {
                counts[vote.selection] = (counts[vote.selection] || 0) + 1;
            });
            
            results[category] = Object.entries(counts)
                .map(([name, votes]) => ({ name, votes }))
                .sort((a, b) => b.votes - a.votes);
        });
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// ==================== ADMIN ROUTES ====================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }
        
        // For demo, accept admin/admin123
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { 
                    userId: 'admin',
                    username: 'admin',
                    isAdmin: true,
                    permissions: ['view', 'edit', 'delete', 'export']
                },
                process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                { expiresIn: '24h' }
            );
            
            return res.json({ 
                success: true, 
                token,
                user: {
                    username: 'admin',
                    isAdmin: true,
                    name: 'Administrator'
                }
            });
        }
        
        // Check database for admin
        if (dbConnected) {
            const user = await Admin.findOne({ username });
            if (user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign(
                    { 
                        userId: user._id,
                        username: user.username,
                        isAdmin: true
                    },
                    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                    { expiresIn: '24h' }
                );
                
                return res.json({ 
                    success: true, 
                    token,
                    user: {
                        username: user.username,
                        isAdmin: true
                    }
                });
            }
        } else {
            // Check demo data
            const user = demoData.admins.find(a => a.username === username && a.password === password);
            if (user) {
                const token = jwt.sign(
                    { 
                        userId: user.id,
                        username: user.username,
                        isAdmin: true
                    },
                    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                    { expiresIn: '24h' }
                );
                
                return res.json({ 
                    success: true, 
                    token,
                    user: {
                        username: user.username,
                        isAdmin: true
                    }
                });
            }
        }
        
        res.status(401).json({ 
            success: false, 
            error: 'Invalid admin credentials' 
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Login failed' 
        });
    }
});

// Get Admin Dashboard Statistics
app.get('/api/admin/statistics', authenticateAdmin, async (req, res) => {
    try {
        let votes;
        if (dbConnected) {
            votes = await Vote.find();
        } else {
            votes = demoData.votes;
        }
        
        const totalVotes = votes.length;
        const uniqueVoters = [...new Set(votes.map(v => v.userIdentifier))].length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const votesToday = votes.filter(v => new Date(v.timestamp) >= today).length;
        
        // Get actual category stats from votes
        const categoryStats = {};
        const categories = [...new Set(votes.map(v => v.category))];
        
        categories.forEach(category => {
            const categoryVotes = votes.filter(v => v.category === category);
            const counts = {};
            
            categoryVotes.forEach(vote => {
                counts[vote.selection] = (counts[vote.selection] || 0) + 1;
            });
            
            categoryStats[category] = counts;
        });
        
        const statistics = {
            totalVotes,
            uniqueVoters,
            votesToday,
            voteTrend: votesToday > 0 ? '+12.5%' : '0%',
            averageVotes: categories.length > 0 ? Math.round(totalVotes / categories.length) : 0,
            categoryStats
        };
        
        res.json(statistics);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get All Votes (Admin)
app.get('/api/admin/votes', authenticateAdmin, async (req, res) => {
    try {
        let votes;
        if (dbConnected) {
            votes = await Vote.find().sort({ timestamp: -1 });
        } else {
            votes = demoData.votes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        res.json({
            votes,
            total: votes.length,
            page: 1,
            totalPages: 1
        });
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
});

// Get Recent Activity
app.get('/api/admin/activity', authenticateAdmin, async (req, res) => {
    try {
        let recentVotes;
        if (dbConnected) {
            recentVotes = await Vote.find()
                .sort({ timestamp: -1 })
                .limit(20);
        } else {
            recentVotes = demoData.votes
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20);
        }
        
        const activities = recentVotes.map(vote => ({
            time: formatTimeAgo(vote.timestamp),
            user: vote.userId,
            category: vote.category,
            vote: vote.selection,
            ip: vote.ipAddress || 'N/A',
            status: 'success'
        }));
        
        res.json({
            activities,
            total: recentVotes.length,
            page: 1,
            totalPages: 1
        });
    } catch (error) {
        console.error('Activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " years ago";
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " months ago";
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " days ago";
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hours ago";
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
}

// ==================== CMS ROUTES ====================

// Get CMS Data
app.get('/api/cms/data', authenticateAdmin, async (req, res) => {
    try {
        let categories, nominees;
        
        if (dbConnected) {
            categories = await Category.find().sort('order');
            nominees = await Nominee.find();
        } else {
            categories = demoData.categories;
            nominees = demoData.nominees;
        }
        
        res.json({
            categories,
            nominees,
            images: [],
            pages: {
                home: {
                    title: 'Anime Awards 2025',
                    subtitle: 'Vote for your favorites across multiple categories',
                    heroImage: '',
                    welcomeMessage: 'Welcome to the biggest anime voting event of the year!'
                }
            },
            settings: {
                siteName: 'Anime Voting 2025',
                siteDescription: 'Vote for your favorite anime',
                theme: {
                    primaryColor: '#6366f1',
                    secondaryColor: '#10b981',
                    accentColor: '#f59e0b',
                    darkMode: false
                }
            }
        });
    } catch (error) {
        console.error('CMS data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save Category
app.post('/api/cms/category', authenticateAdmin, async (req, res) => {
    try {
        const categoryData = req.body;
        
        if (dbConnected) {
            if (categoryData._id) {
                await Category.findByIdAndUpdate(categoryData._id, categoryData);
            } else {
                await Category.create(categoryData);
            }
        } else {
            if (categoryData._id) {
                const index = demoData.categories.findIndex(c => c._id === categoryData._id);
                if (index !== -1) {
                    demoData.categories[index] = categoryData;
                }
            } else {
                categoryData._id = 'cat_' + Date.now();
                demoData.categories.push(categoryData);
            }
        }
        
        res.json({ success: true, message: 'Category saved successfully' });
    } catch (error) {
        console.error('Save category error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save Nominee
app.post('/api/cms/nominee', authenticateAdmin, async (req, res) => {
    try {
        const nomineeData = req.body;
        
        if (dbConnected) {
            if (nomineeData._id) {
                await Nominee.findByIdAndUpdate(nomineeData._id, nomineeData);
            } else {
                await Nominee.create(nomineeData);
            }
        } else {
            if (nomineeData._id) {
                const index = demoData.nominees.findIndex(n => n._id === nomineeData._id);
                if (index !== -1) {
                    demoData.nominees[index] = nomineeData;
                }
            } else {
                nomineeData._id = 'nom_' + Date.now();
                nomineeData.votes = nomineeData.votes || 0;
                demoData.nominees.push(nomineeData);
            }
        }
        
        res.json({ success: true, message: 'Nominee saved successfully' });
    } catch (error) {
        console.error('Save nominee error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve index.html for all other routes (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// For Vercel, we need to export the app
if (require.main === module) {
    // Running directly (not imported)
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Database: ${dbConnected ? 'MongoDB' : 'Demo mode'}`);
        console.log(`Voting system ready! No login required for voting.`);
        console.log(`Admin login: admin/admin123`);
    });
}

// Export for Vercel
module.exports = app;
