const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anime-voting', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schemas
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

const VoteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    category: { type: String, required: true },
    selection: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Vote = mongoose.model('Vote', VoteSchema);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            password: hashedPassword
        });
        
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ token, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit Vote
app.post('/api/vote', authenticateToken, async (req, res) => {
    try {
        const { category, selection } = req.body;
        const userId = req.user.userId;
        
        // Check if user already voted in this category
        const existingVote = await Vote.findOne({ userId, category });
        if (existingVote) {
            return res.status(400).json({ error: 'Already voted in this category' });
        }
        
        const vote = new Vote({
            userId,
            category,
            selection
        });
        
        await vote.save();
        res.json({ message: 'Vote submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User's Votes
app.get('/api/my-votes', authenticateToken, async (req, res) => {
    try {
        const votes = await Vote.find({ userId: req.user.userId });
        res.json(votes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Votes (Admin only)
app.get('/api/all-votes', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const votes = await Vote.find().populate('userId', 'username');
        res.json(votes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Vote Statistics (Admin only)
app.get('/api/statistics', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const votes = await Vote.find();
        const categories = [
            'Best Anime of 2025',
            'Best Animation Studio',
            'Best Voice Actor of 2025',
            'Most Anticipated Anime of 2025'
        ];
        
        const statistics = {};
        categories.forEach(category => {
            statistics[category] = {};
            const categoryVotes = votes.filter(v => v.category === category);
            
            categoryVotes.forEach(vote => {
                if (!statistics[category][vote.selection]) {
                    statistics[category][vote.selection] = 0;
                }
                statistics[category][vote.selection]++;
            });
        });
        
        const totalVotes = votes.length;
        const uniqueVoters = [...new Set(votes.map(v => v.userId))].length;
        
        res.json({
            statistics,
            totalVotes,
            uniqueVoters,
            categories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset Votes (Admin only)
app.delete('/api/reset-votes', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        await Vote.deleteMany({});
        res.json({ message: 'All votes have been reset' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create default admin user (run once)
app.post('/api/create-admin', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            username: 'admin',
            password: hashedPassword,
            isAdmin: true
        });
        
        await admin.save();
        res.json({ message: 'Admin user created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // In production, use database lookup
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { 
                    userId: 'admin',
                    username: 'admin',
                    isAdmin: true,
                    permissions: ['view', 'edit', 'delete', 'export']
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({ 
                success: true, 
                token,
                user: {
                    username: 'admin',
                    isAdmin: true,
                    name: 'Administrator'
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Verify Admin Token
app.post('/api/admin/verify', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ 
            success: false, 
            error: 'Admin access required' 
        });
    }
    
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// Get Admin Statistics
app.get('/api/admin/statistics', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const totalVotes = await Vote.countDocuments();
        const uniqueVoters = await Vote.distinct('userId').count();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const votesToday = await Vote.countDocuments({ 
            timestamp: { $gte: today } 
        });
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const votesYesterday = await Vote.countDocuments({ 
            timestamp: { 
                $gte: yesterday, 
                $lt: today 
            } 
        });
        
        const voteTrend = votesYesterday > 0 
            ? ((votesToday - votesYesterday) / votesYesterday * 100).toFixed(1)
            : 0;
        
        const categories = [
            'Best Anime of 2025',
            'Best Animation Studio',
            'Best Voice Actor of 2025',
            'Most Anticipated Anime of 2025'
        ];
        
        const categoryStats = {};
        for (const category of categories) {
            const votes = await Vote.find({ category });
            const counts = {};
            
            votes.forEach(vote => {
                counts[vote.selection] = (counts[vote.selection] || 0) + 1;
            });
            
            categoryStats[category] = counts;
        }
        
        res.json({
            totalVotes,
            uniqueVoters,
            votesToday,
            voteTrend: voteTrend > 0 ? `+${voteTrend}%` : `${voteTrend}%`,
            averageVotes: Math.round(totalVotes / categories.length),
            categoryStats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Recent Activity
app.get('/api/admin/activity', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { page = 1, limit = 10, category, days } = req.query;
        const skip = (page - 1) * limit;
        
        let filter = {};
        
        if (category && category !== 'all') {
            filter.category = category;
        }
        
        if (days && days !== 'all') {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            filter.timestamp = { $gte: date };
        }
        
        const activities = await Vote.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'username')
            .lean();
        
        const total = await Vote.countDocuments(filter);
        
        // Format activities for display
        const formattedActivities = activities.map(activity => ({
            time: formatTimeAgo(activity.timestamp),
            user: activity.userId?.username || 'Anonymous',
            category: activity.category,
            vote: activity.selection,
            ip: activity.ip || 'N/A',
            status: 'success'
        }));
        
        res.json({
            activities: formattedActivities,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}
// CMS API Endpoints

// Get CMS Data
app.get('/api/cms/data', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const data = {
            categories: await Category.find().sort('order'),
            nominees: await Nominee.find().populate('categoryId', 'name color'),
            images: await Image.find(),
            pages: await Page.findOne() || { home: {}, about: {} },
            settings: await Settings.findOne() || {}
        };

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save CMS Data
app.post('/api/cms/save', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { type, data } = req.body;

        switch (type) {
            case 'category':
                if (data._id) {
                    await Category.findByIdAndUpdate(data._id, data);
                } else {
                    await Category.create(data);
                }
                break;

            case 'nominee':
                if (data._id) {
                    await Nominee.findByIdAndUpdate(data._id, data);
                } else {
                    await Nominee.create(data);
                }
                break;

            case 'image':
                // Handle image upload
                break;

            case 'page':
                await Page.findOneAndUpdate({}, data, { upsert: true });
                break;

            case 'settings':
                await Settings.findOneAndUpdate({}, data, { upsert: true });
                break;
        }

        res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload Image
app.post('/api/cms/upload', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Handle file upload
        // This would use multer or similar middleware
        res.json({ success: true, url: '/uploads/filename.jpg' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export Data
app.get('/api/cms/export', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const data = {
            categories: await Category.find(),
            nominees: await Nominee.find(),
            images: await Image.find(),
            pages: await Page.findOne(),
            settings: await Settings.findOne(),
            exportDate: new Date()
        };

        res.setHeader('Content-Disposition', 'attachment; filename=cms-export.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Import Data
app.post('/api/cms/import', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { data } = req.body;

        // Clear existing data
        await Category.deleteMany({});
        await Nominee.deleteMany({});
        await Image.deleteMany({});

        // Import new data
        if (data.categories) {
            await Category.insertMany(data.categories);
        }
        if (data.nominees) {
            await Nominee.insertMany(data.nominees);
        }
        if (data.images) {
            await Image.insertMany(data.images);
        }

        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
