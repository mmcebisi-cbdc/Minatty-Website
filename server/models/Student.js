const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    grade: {
        type: String,
        required: true,
        enum: ['4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    school: {
        type: String,
        trim: true
    },
    subjectsOfInterest: [{
        type: String
    }],
    learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing', 'not-sure'],
        default: 'not-sure'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Student', studentSchema);
