const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: 'fa-tag'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'upcoming'],
        default: 'active'
    },
    maxSelections: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Category', CategorySchema);