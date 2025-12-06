const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'Anime Voting 2025'
    },
    siteDescription: {
        type: String,
        default: 'Vote for your favorite anime'
    },
    theme: {
        primaryColor: { type: String, default: '#6366f1' },
        secondaryColor: { type: String, default: '#10b981' },
        accentColor: { type: String, default: '#f59e0b' },
        darkMode: { type: Boolean, default: false }
    },
    voting: {
        allowMultipleVotes: { type: Boolean, default: false },
        requireLogin: { type: Boolean, default: true },
        showResults: { type: Boolean, default: true }
    },
    email: {
        smtpHost: { type: String, default: '' },
        smtpPort: { type: Number, default: 587 },
        smtpUser: { type: String, default: '' },
        smtpPass: { type: String, default: '' }
    },
    maintenance: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'Site under maintenance' }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);