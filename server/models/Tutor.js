const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
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

    // Academic Qualifications
    qualification: {
        type: String,
        required: true,
        enum: ['bachelors', 'honours', 'masters', 'phd', 'teaching-cert', 'currently-studying']
    },
    university: {
        type: String,
        default: ''
    },

    // Teaching Information
    subjects: [{
        type: String,
        required: true
    }],
    gradeLevel: [{
        type: String
    }],
    experience: {
        type: String,
        required: true,
        enum: ['0-1', '1-3', '3-5', '5+']
    },
    workExperience: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        required: true
    },

    // Pricing & Availability
    hourlyRate: {
        type: Number,
        required: true,
        min: 100,
        max: 500
    },
    teachingFormat: [{
        type: String,
        enum: ['online', 'in-person']
    }],
    location: {
        city: String,
        province: String
    },
    availability: [{
        day: String,
        slots: [String]
    }],

    // Reviews & Ratings
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    reviews: [{
        studentName: String,
        rating: Number,
        comment: String,
        subject: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // Status & Verification
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    verified: {
        type: Boolean,
        default: false
    },

    // Statistics
    totalStudents: {
        type: Number,
        default: 0
    },
    totalHours: {
        type: Number,
        default: 0
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
tutorSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Tutor', tutorSchema);
