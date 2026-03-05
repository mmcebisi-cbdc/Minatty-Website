const mongoose = require('mongoose');

// MongoDB Connection String
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty';

// Function to check database directly
async function checkDatabase() {
    console.log('--- CHECKING DATABASE ---');
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        // Allow any schema, we just want to see the data
        const collection = mongoose.connection.collection('tutors');

        const count = await collection.countDocuments();
        console.log(`Total Tutors in DB: ${count}`);

        const approvedCount = await collection.countDocuments({ status: 'approved' });
        console.log(`Approved Tutors: ${approvedCount}`);

        if (approvedCount > 0) {
            const tutors = await collection.find({ status: 'approved' }).limit(3).toArray();
            console.log('Sample Approved Tutors:', JSON.stringify(tutors, null, 2));
        } else {
            console.log('⚠️ No approved tutors found! This is why the list is empty.');

            // Allow creating a mock tutor if none exist
            if (count === 0) {
                console.log('Would you like to seed a mock tutor? (Run seed_tutors.js)');
            }
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
        // Use native fetch (Node 18+)
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
