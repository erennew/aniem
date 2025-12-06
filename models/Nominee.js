const mongoose = require('mongoose');

const NomineeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    views: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    votes: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('Nominee', NomineeSchema);