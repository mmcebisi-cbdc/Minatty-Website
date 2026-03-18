const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Tutor = require('./server/models/Tutor');

async function fixTutorStatuses() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty';
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Find tutors who are verified but not approved
        const inconsistentTutors = await Tutor.find({ 
            verified: true, 
            status: { $ne: 'approved' } 
        });

        console.log(`Found ${inconsistentTutors.length} tutors with inconsistent status (verified=true, status!=approved)`);

        if (inconsistentTutors.length > 0) {
            const result = await Tutor.updateMany(
                { verified: true, status: { $ne: 'approved' } },
                { $set: { status: 'approved' } }
            );
            console.log(`Updated ${result.nModified || result.modifiedCount} tutors to 'approved' status.`);
        }

        // Also check for 'approved' tutors who should be 'verified' (optional but good for consistency)
        const approvedButNotVerified = await Tutor.find({
            status: 'approved',
            verified: { $ne: true }
        });
        
        console.log(`Found ${approvedButNotVerified.length} tutors with status='approved' but verified!=true`);
        if (approvedButNotVerified.length > 0) {
            const result = await Tutor.updateMany(
                { status: 'approved', verified: { $ne: true } },
                { $set: { verified: true } }
            );
            console.log(`Updated ${result.nModified || result.modifiedCount} tutors to 'verified=true'.`);
        }

    } catch (err) {
        console.error('Error during fix:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixTutorStatuses();
