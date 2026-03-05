
const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('MongoDB Connected');

        // Check if any exist
        const count = await Application.countDocuments();
        if (count > 0) {
            console.log(`Found ${count} applications. No need to seed.`);
            process.exit(0);
        }

        const app = new Application({
            fullName: 'Test Tutor',
            email: 'test@example.com',
            phone: '0123456789',
            qualification: 'bachelors',
            subjects: ['mathematics-grade-12'],
            experience: '1-3',
            preferredRate: 200,
            location: 'Johannesburg',
            teachingFormat: ['online'],
            bio: 'This is a test application.',
            status: 'pending'
        });

        await app.save();
        console.log('Seeded one application.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
