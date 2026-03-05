const mongoose = require('mongoose');
require('dotenv').config();

const Tutor = require('./models/Tutor');

async function checkTutors() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        const allTutors = await Tutor.find({});
        console.log(`Total Tutors: ${allTutors.length}`);

        const approvedTutors = await Tutor.find({ status: 'approved' });
        console.log(`Approved Tutors: ${approvedTutors.length}`);

        if (approvedTutors.length > 0) {
            console.log('Sample Approved Tutor Data:');
            approvedTutors.forEach(t => {
                console.log('--------------------------------');
                console.log(`ID: ${t._id}`);
                console.log(`Name: ${t.fullName}`);
                console.log(`Email: ${t.email}`);
                console.log(`Status: ${t.status}`);
                console.log(`Verified: ${t.verified}`);
                console.log(`Hourly Rate: ${t.hourlyRate}`);
                console.log(`Teaching Format: ${JSON.stringify(t.teachingFormat)}`);
                console.log(`Subjects: ${JSON.stringify(t.subjects)}`);
                console.log(`Grades: ${JSON.stringify(t.gradeLevel)}`);
                console.log(`Locations: ${JSON.stringify(t.location)}`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTutors();
