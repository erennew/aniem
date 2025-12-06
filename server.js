const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['https://aniem-9n8sxeckl-erennews-projects.vercel.app', 'https://aniem-ashen.vercel.app'],
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

// Schemas (define them inline to avoid file issues)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const VoteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    category: { type: String, required: true },
    selection: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
});

// CMS Schemas (simplified for now)
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
const User = mongoose.model('User', UserSchema);
const Vote = mongoose.model('Vote', VoteSchema);
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
    users: []
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
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
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

// ==================== AUTH ROUTES ====================

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        if (dbConnected) {
            // Check if user exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            // Hash password and create user
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                username,
                password: hashedPassword
            });
            
            await user.save();
        } else {
            // Demo mode
            const existingUser = demoData.users.find(u => u.username === username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            demoData.users.push({
                id: 'user_' + Date.now(),
                username,
                password: await bcrypt.hash(password, 10),
                isAdmin: false
            });
        }
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        let user;
        
        if (dbConnected) {
            user = await User.findOne({ username });
        } else {
            // Demo mode
            user = demoData.users.find(u => u.username === username);
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password || user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { 
                userId: user._id || user.id, 
                username: user.username, 
                isAdmin: user.isAdmin || false 
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token, 
            user: { 
                username: user.username, 
                isAdmin: user.isAdmin || false 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== VOTING ROUTES ====================

// Submit Vote
app.post('/api/vote', authenticateToken, async (req, res) => {
    try {
        const { category, selection } = req.body;
        const userId = req.user.userId;
        
        if (!category || !selection) {
            return res.status(400).json({ error: 'Category and selection required' });
        }
        
        // Check if already voted in this category
        let existingVote;
        if (dbConnected) {
            existingVote = await Vote.findOne({ userId, category });
        } else {
            existingVote = demoData.votes.find(v => v.userId === userId && v.category === category);
        }
        
        if (existingVote) {
            return res.status(400).json({ error: 'Already voted in this category' });
        }
        
        // Create vote
        const voteData = {
            userId,
            category,
            selection,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        if (dbConnected) {
            const vote = new Vote(voteData);
            await vote.save();
        } else {
            demoData.votes.push({
                id: 'vote_' + Date.now(),
                ...voteData
            });
        }
        
        res.json({ message: 'Vote submitted successfully' });
    } catch (error) {
        console.error('Voting error:', error);
        res.status(500).json({ error: 'Voting failed' });
    }
});

// Get User's Votes
app.get('/api/my-votes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        let votes;
        if (dbConnected) {
            votes = await Vote.find({ userId });
        } else {
            votes = demoData.votes.filter(v => v.userId === userId);
        }
        
        res.json(votes);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
});

// Get Vote Results
app.get('/api/results', async (req, res) => {
    try {
        let votes;
        if (dbConnected) {
            votes = await Vote.find();
        } else {
            votes = demoData.votes;
        }
        
        const categories = [
            'Best Anime of 2025',
            'Best Animation Studio', 
            'Best Voice Actor of 2025',
            'Most Anticipated Anime of 2025'
        ];
        
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
            const user = await User.findOne({ username });
            if (user && user.isAdmin && await bcrypt.compare(password, user.password)) {
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
app.get('/api/admin/statistics', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        let votes;
        if (dbConnected) {
            votes = await Vote.find();
        } else {
            votes = demoData.votes;
        }
        
        const totalVotes = votes.length;
        const uniqueVoters = [...new Set(votes.map(v => v.userId))].length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const votesToday = votes.filter(v => new Date(v.timestamp) >= today).length;
        
        // Mock data for demo
        const statistics = {
            totalVotes,
            uniqueVoters,
            votesToday,
            voteTrend: '+12.5%',
            averageVotes: Math.round(totalVotes / 4),
            categoryStats: {
                'Best Anime of 2025': {
                    'Attack on Titan: Final Season': 456,
                    'Jujutsu Kaisen': 389,
                    'Demon Slayer: Mugen Train': 342,
                    'Re:Zero Season 3': 212
                },
                'Best Animation Studio': {
                    'MAPPA': 623,
                    'Ufotable': 512,
                    'Kyoto Animation': 433
                },
                'Best Voice Actor of 2025': {
                    'Yuki Kaji': 567,
                    'Natsuki Hanae': 489,
                    'Jun Fukuyama': 398
                },
                'Most Anticipated Anime of 2025': {
                    'Attack on Titan: The Final Battle': 845,
                    'Chainsaw Man Season 2': 723
                }
            }
        };
        
        res.json(statistics);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get Recent Activity
app.get('/api/admin/activity', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // Mock activity data
        const activities = [
            { time: '2 minutes ago', user: 'anime_lover_42', category: 'Best Anime', vote: 'Attack on Titan', ip: '192.168.1.1', status: 'success' },
            { time: '5 minutes ago', user: 'weeb_king', category: 'Best Studio', vote: 'MAPPA', ip: '10.0.0.5', status: 'success' },
            { time: '12 minutes ago', user: 'otaku_girl', category: 'Best Actor', vote: 'Yuki Kaji', ip: '172.16.0.8', status: 'success' },
            { time: '25 minutes ago', user: 'demo_user', category: 'Most Anticipated', vote: 'Chainsaw Man', ip: '203.0.113.42', status: 'success' }
        ];
        
        res.json({
            activities,
            total: 42,
            page: 1,
            totalPages: 5
        });
    } catch (error) {
        console.error('Activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// ==================== CMS ROUTES ====================

// Get CMS Data
app.get('/api/cms/data', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
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
app.post('/api/cms/category', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
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
app.post('/api/cms/nominee', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
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
    });
}

// Export for Vercel
module.exports = app;
