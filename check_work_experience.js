const mongoose = require('mongoose');
const Tutor = require('./server/models/Tutor');
const Application = require('./server/models/Application');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Connected to MongoDB');

        console.log('--- Checking Applications ---');
        const apps = await Application.find().sort({ submittedAt: -1 }).limit(3);
        apps.forEach(app => {
            console.log(`App Email: ${app.email}`);
            console.log(`Work Experience: ${app.workExperience}`);
            console.log('----------------');
        });

        console.log('--- Checking Tutors ---');
        const tutors = await Tutor.find().sort({ createdAt: -1 }).limit(3);
        tutors.forEach(tutor => {
            console.log(`Tutor Name: ${tutor.fullName}`);
            console.log(`Work Experience: ${tutor.workExperience}`);
            console.log('----------------');
        });

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });
