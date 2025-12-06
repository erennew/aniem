const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Best Anime of 2025',
            'Best Animation Studio',
            'Best Voice Actor of 2025',
            'Most Anticipated Anime of 2025'
        ]
    },
    selection: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        browser: String,
        os: String,
        device: String,
        location: {
            country: String,
            city: String
        }
    }
}, {
    timestamps: true
});

// Compound index to ensure one vote per user per category
VoteSchema.index({ userId: 1, category: 1 }, { unique: true });

// Indexes for faster queries
VoteSchema.index({ category: 1, selection: 1 });
VoteSchema.index({ timestamp: -1 });
VoteSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Vote', VoteSchema);
