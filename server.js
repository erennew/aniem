
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to get client IP
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket.remoteAddress;
};

// Voting data storage
let votingData = {
    'Best Anime of 2025': {
        'Attack on Titan: Final Season': 456,
        'Jujutsu Kaisen': 389,
        'Demon Slayer: Mugen Train': 342,
        'Re:Zero - Starting Life in Another World': 267
    },
    'Best Animation Studio': {
        'MAPPA': 523,
        'Ufotable': 421,
        'Kyoto Animation': 398
    },
    'Best Voice Actor of 2025': {
        'Yuki Kaji': 267,
        'Natsuki Hanae': 245,
        'Jun Fukuyama': 189
    },
    'Most Anticipated Anime of 2025': {
        'Attack on Titan: The Final Battle': 512,
        'Chainsaw Man Season 2': 467
    }
};

// Store IPs that have voted
let votedIPs = new Set();
// Store which categories each IP has voted in
let ipVoteHistory = new Map(); // Map<IP, Set<category>>

// Load saved data from file
function loadData() {
    try {
        if (fs.existsSync('voting-data.json')) {
            const data = JSON.parse(fs.readFileSync('voting-data.json', 'utf8'));
            votingData = data.votingData || votingData;
            
            // Convert saved arrays back to Sets and Maps
            votedIPs = new Set(data.votedIPs || []);
            
            ipVoteHistory = new Map();
            if (data.ipVoteHistory) {
                Object.entries(data.ipVoteHistory).forEach(([ip, categories]) => {
                    ipVoteHistory.set(ip, new Set(categories));
                });
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Save data to file
function saveData() {
    try {
        const data = {
            votingData,
            votedIPs: Array.from(votedIPs),
            ipVoteHistory: Array.from(ipVoteHistory.entries()).reduce((obj, [ip, categories]) => {
                obj[ip] = Array.from(categories);
                return obj;
            }, {})
        };
        fs.writeFileSync('voting-data.json', JSON.stringify(data, null, 2));
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Load data on startup
loadData();

// Auto-save data every 5 minutes
setInterval(saveData, 5 * 60 * 1000);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// API Routes

// Get voting results
app.get('/api/results', (req, res) => {
    try {
        const results = {};
        Object.keys(votingData).forEach(category => {
            results[category] = Object.entries(votingData[category])
                .map(([name, votes]) => ({ name, votes }))
                .sort((a, b) => b.votes - a.votes);
        });
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Check if IP has voted in a category
app.post('/api/check-vote', (req, res) => {
    try {
        const clientIP = getClientIP(req);
        const { category } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }
        
        const hasVoted = ipVoteHistory.has(clientIP) && 
                        ipVoteHistory.get(clientIP).has(category);
        
        res.json({ 
            hasVoted,
            ip: clientIP,
            canVote: !hasVoted
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check vote status' });
    }
});

// Submit a vote
app.post('/api/vote', (req, res) => {
    try {
        const clientIP = getClientIP(req);
        const { category, selection } = req.body;
        
        if (!category || !selection) {
            return res.status(400).json({ error: 'Category and selection are required' });
        }
        
        // Check if IP has already voted in this category
        if (ipVoteHistory.has(clientIP) && ipVoteHistory.get(clientIP).has(category)) {
            return res.status(403).json({ 
                success: false, 
                error: 'You have already voted in this category',
                canVote: false
            });
        }
        
        // Initialize voting category if it doesn't exist
        if (!votingData[category]) {
            votingData[category] = {};
        }
        
        // Initialize selection count if it doesn't exist
        if (!votingData[category][selection]) {
            votingData[category][selection] = 0;
        }
        
        // Record the vote
        votingData[category][selection]++;
        
        // Track the IP's vote
        votedIPs.add(clientIP);
        
        if (!ipVoteHistory.has(clientIP)) {
            ipVoteHistory.set(clientIP, new Set());
        }
        ipVoteHistory.get(clientIP).add(category);
        
        // Save data immediately
        saveData();
        
        console.log(`Vote recorded from ${clientIP}: ${category} - ${selection} (Total: ${votingData[category][selection]})`);
        
        res.json({ 
            success: true, 
            message: 'Vote recorded successfully',
            totalVotes: votingData[category][selection],
            ip: clientIP,
            canVote: true,
            categoriesVoted: ipVoteHistory.has(clientIP) ? 
                Array.from(ipVoteHistory.get(clientIP)) : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Get voting statistics
app.get('/api/stats', (req, res) => {
    try {
        let totalVotes = 0;
        let uniqueVoters = votedIPs.size;
        let votesByCategory = {};
        
        Object.keys(votingData).forEach(category => {
            const categoryVotes = Object.values(votingData[category]).reduce((sum, votes) => sum + votes, 0);
            totalVotes += categoryVotes;
            votesByCategory[category] = categoryVotes;
        });
        
        res.json({
            totalVotes,
            uniqueVoters,
            votesByCategory,
            totalIPs: uniqueVoters
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Reset votes for testing (admin only)
app.post('/api/admin/reset-votes', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Reset all votes
        Object.keys(votingData).forEach(category => {
            Object.keys(votingData[category]).forEach(selection => {
                votingData[category][selection] = 0;
            });
        });
        
        // Clear IP tracking
        votedIPs.clear();
        ipVoteHistory.clear();
        
        saveData();
        
        res.json({ 
            success: true, 
            message: 'All votes reset successfully',
            totalVotes: 0,
            uniqueVoters: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset votes' });
    }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin authentication
        if (username === 'admin' && password === 'admin123') {
            const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
            
            res.json({
                success: true,
                token: token,
                user: {
                    username: 'admin',
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin statistics
app.get('/api/admin/statistics', (req, res) => {
    try {
        // Verify admin token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Calculate statistics
        let totalVotes = 0;
        let votesToday = 0;
        
        Object.values(votingData).forEach(category => {
            Object.values(category).forEach(votes => {
                totalVotes += votes;
            });
        });
        
        // Mock some data for demonstration
        const stats = {
            totalVotes,
            uniqueVoters: votedIPs.size,
            averageVotes: Math.floor(totalVotes / 4),
            votesToday: Math.floor(totalVotes * 0.08),
            voteTrend: '+12.5%',
            voterTrend: Math.floor(votedIPs.size * 0.05),
            avgTrend: '+4.2%',
            activityTrend: 15,
            totalIPs: votedIPs.size,
            votingRate: totalVotes > 0 ? (votedIPs.size / totalVotes * 100).toFixed(2) + '%' : '0%'
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get IP voting history (admin only)
app.get('/api/admin/ip-history', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const history = Array.from(ipVoteHistory.entries()).map(([ip, categories]) => ({
            ip,
            categories: Array.from(categories),
            totalVotes: Array.from(categories).length
        }));
        
        res.json({
            totalIPs: votedIPs.size,
            history: history.sort((a, b) => b.totalVotes - a.totalVotes)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch IP history' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Public voting page: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`Admin login: http://localhost:${PORT}/login.html`);
    console.log(`\nVoting Rules:`);
    console.log(`- Each IP can vote once per category`);
    console.log(`- Total unique voters: ${votedIPs.size}`);
    console.log(`- Data is saved to voting-data.json`);
});
