const mongoose = require('mongoose');
require('dotenv').config();

const Tutor = require('./server/models/Tutor');

async function checkTutors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
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
                console.log(`Name: ${t.fullName}`);
                console.log(`Email: ${t.email}`);
                console.log(`Status: ${t.status}`);
                console.log(`Verified: ${t.verified}`);
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
