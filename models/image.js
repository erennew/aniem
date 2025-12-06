const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['nominee', 'banner', 'background', 'icon', 'other'],
        default: 'nominee'
    },
    size: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Image', ImageSchema);