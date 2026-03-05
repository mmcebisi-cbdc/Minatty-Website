const mongoose = require('mongoose');
const fetch = require('node-fetch');

// MongoDB Connection String
const MONGO_URI = 'mongodb://localhost:27017/minatty';

// Function to check database directly
async function checkDatabase() {
    console.log('--- CHECKING DATABASE ---');
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        // Define minimalistic Tutor schema to query
        const TutorSchema = new mongoose.Schema({
            fullName: String,
            status: String,
            hourlyRate: Number,
            subjects: [String]
        });

        // Check if model already exists to avoid overwrite error
        const Tutor = mongoose.models.Tutor || mongoose.model('Tutor', TutorSchema);

        const count = await Tutor.countDocuments();
        console.log(`Total Tutors in DB: ${count}`);

        const approvedCount = await Tutor.countDocuments({ status: 'approved' });
        console.log(`Approved Tutors: ${approvedCount}`);

        if (approvedCount > 0) {
            const tutors = await Tutor.find({ status: 'approved' }).limit(3);
            console.log('Sample Approved Tutors:', JSON.stringify(tutors, null, 2));
        } else {
            console.log('⚠️ No approved tutors found! This is likely why the list is empty.');
        }

    } catch (error) {
        console.error('❌ Database Check Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Function to check API response
async function checkApi() {
    console.log('\n--- CHECKING API ENDPOINT ---');
    const url = 'http://localhost:5000/api/tutors';
    try {
        const response = await fetch(url);
        console.log(`Response Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`API Returned ${data.length} tutors`);
            if (data.length > 0) {
                console.log('Sample API Data:', JSON.stringify(data[0], null, 2));
            }
        } else {
            console.log('❌ API Error:', await response.text());
        }
    } catch (error) {
        console.error('❌ API Check Failed. Is the server running?');
        console.error('Error details:', error.message);
    }
}

// Run checks
(async () => {
    await checkDatabase();
    await checkApi();
})();
