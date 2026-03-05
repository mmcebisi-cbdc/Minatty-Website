const mongoose = require('mongoose');
require('dotenv').config();
const Tutor = require('./models/Tutor');

async function debugTutors() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const tutors = await Tutor.find({});
        console.log(`Total Tutors: ${tutors.length}`);

        tutors.forEach(t => {
            console.log(`ID: ${t._id}, Name: ${t.fullName}, Status: '${t.status}', Verified: ${t.verified}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugTutors();
