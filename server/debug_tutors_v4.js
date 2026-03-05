const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Application = require('./models/Application');
const Tutor = require('./models/Tutor');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('✅ MongoDB Connected');

        console.log('\n--- APPLICATIONS ---');
        const apps = await Application.find({});
        console.log(`Found ${apps.length} applications.`);
        apps.forEach(app => {
            console.log(`ID: ${app._id}, Name: ${app.fullName}, Status: ${app.status}`);
            console.log(`   ProfileImage: '${app.profileImage}'`);
        });

        console.log('\n--- TUTORS ---');
        const tutors = await Tutor.find({});
        console.log(`Found ${tutors.length} tutors.`);
        tutors.forEach(tutor => {
            console.log(`ID: ${tutor._id}, Name: ${tutor.fullName}, Verified: ${tutor.verified}, Status: ${tutor.status}`);
            console.log(`   ProfileImage: '${tutor.profileImage}'`);
            console.log(`   Subjects: ${tutor.subjects}`);
        });

        mongoose.disconnect();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
