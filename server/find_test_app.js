const mongoose = require('mongoose');
const Application = require('./models/Application');
const Tutor = require('./models/Tutor');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Connected to MongoDB');

        // Find the latest test application
        const app = await Application.findOne({ email: /test_work_exp/ }).sort({ submittedAt: -1 });

        if (!app) {
            console.log('No test application found.');
            process.exit(1);
        }

        console.log(`Found application: ${app.email}`);
        console.log(`Work Experience in App: ${app.workExperience}`);

        // Simulate approval process (calling the logic from routes/applications.js manually or via API)
        // Let's use fetch to call the API to ensure the route logic is tested

        // We can't easily use fetch inside this script if we want to rely on the running server
        // But since we are verifying the CODE, let's just use the same logic as the route here to verify it works
        // OR better, write a script that calls the PUT API.

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
