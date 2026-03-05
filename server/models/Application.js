const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    qualificationsDoc: {
        type: String,
        default: ''
    },
    identityDoc: {
        type: String,
        default: ''
    },

    // Academic Information
    qualification: {
        type: String,
        required: true
    },
    subjects: [{
        type: String,
        required: true
    }],
    experience: {
        type: String,
        required: true
    },
    workExperience: {
        type: String,
        default: ''
    },

    // Teaching Preferences
    preferredRate: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    teachingFormat: [{
        type: String
    }],

    // Personal Statement
    bio: {
        type: String,
        required: true
    },

    // Application Status
    status: {
        type: String,
        enum: ['pending', 'under-review', 'interview-scheduled', 'approved', 'rejected'],
        default: 'pending'
    },

    // Admin Notes
    adminNotes: {
        type: String,
        default: ''
    },

    // Timestamps
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

applicationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Application', applicationSchema);
