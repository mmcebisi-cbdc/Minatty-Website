const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    studentEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true // Intended date for the session
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    lessonType: {
        type: String,
        enum: ['trial', 'regular'],
        default: 'regular'
    },
    lessonFormat: {
        type: String,
        enum: ['online', 'in-person'],
        default: 'online'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'none'],
        default: 'none'
    },
    transactionId: {
        type: String
    },
    amount: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
