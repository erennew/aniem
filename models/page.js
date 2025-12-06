const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
    home: {
        title: { type: String, default: 'Anime Awards 2025' },
        subtitle: { type: String, default: 'Vote for your favorites' },
        heroImage: { type: String, default: '' },
        welcomeMessage: { type: String, default: '' }
    },
    about: {
        title: { type: String, default: 'About Us' },
        content: { type: String, default: '' }
    },
    rules: {
        title: { type: String, default: 'Rules & Guidelines' },
        content: { type: String, default: '' }
    },
    contact: {
        title: { type: String, default: 'Contact Us' },
        content: { type: String, default: '' },
        email: { type: String, default: '' },
        socialLinks: [{
            platform: String,
            url: String
        }]
    },
    footer: {
        copyright: { type: String, default: '© 2025 Anime Awards' },
        links: [{
            text: String,
            url: String
        }]
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Page', PageSchema);