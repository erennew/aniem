const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Models
const User = require('./models/User');
const Vote = require('./models/Vote');

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');
        
        // Clear existing data
        await User.deleteMany({});
        await Vote.deleteMany({});
        
        // Create admin user
        const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        const adminUser = new User({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: adminPassword,
            isAdmin: true,
            email: 'admin@animevoting.com'
        });
        await adminUser.save();
        console.log('Admin user created');
        
        // Create some test users
        const testUsers = [
            { username: 'anime_lover', password: 'password123', email: 'anime@example.com' },
            { username: 'weeb_master', password: 'password123', email: 'weeb@example.com' },
            { username: 'otaku_king', password: 'password123', email: 'otaku@example.com' },
            { username: 'voter_01', password: 'password123', email: 'voter1@example.com' },
            { username: 'voter_02', password: 'password123', email: 'voter2@example.com' }
        ];
        
        for (const userData of testUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                username: userData.username,
                password: hashedPassword,
                email: userData.email
            });
            await user.save();
        }
        console.log('Test users created');
        
        // Create sample votes
        const categories = [
            'Best Anime of 2025',
            'Best Animation Studio',
            'Best Voice Actor of 2025',
            'Most Anticipated Anime of 2025'
        ];
        
        const selections = {
            'Best Anime of 2025': ['Attack on Titan: Final Season', 'Jujutsu Kaisen', 'Demon Slayer: Mugen Train', 'Re:Zero - Starting Life in Another World'],
            'Best Animation Studio': ['MAPPA', 'Ufotable', 'Kyoto Animation'],
            'Best Voice Actor of 2025': ['Yuki Kaji', 'Natsuki Hanae', 'Jun Fukuyama'],
            'Most Anticipated Anime of 2025': ['Attack on Titan: The Final Battle', 'Chainsaw Man Season 2']
        };
        
        const users = await User.find({ isAdmin: false });
        
        // Each user votes in each category
        for (const user of users) {
            for (const category of categories) {
                const availableSelections = selections[category];
                const randomSelection = availableSelections[Math.floor(Math.random() * availableSelections.length)];
                
                const vote = new Vote({
                    userId: user._id,
                    category,
                    selection: randomSelection,
                    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date in last 7 days
                });
                await vote.save();
            }
        }
        console.log('Sample votes created');
        
        console.log('Database seeding completed successfully!');
        console.log(`Created: ${users.length + 1} users, ${users.length * categories.length} votes`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();