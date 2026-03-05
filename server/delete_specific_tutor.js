const mongoose = require('mongoose');
require('dotenv').config();

const Tutor = require('./models/Tutor');
const User = require('./models/User'); // If cascading delete is needed
const Application = require('./models/Application'); // If cascading delete is needed

const TUTOR_ID = '6985cfebaad5c0e7fc07df4d';

async function deleteTutor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        const tutor = await Tutor.findById(TUTOR_ID);
        if (!tutor) {
            console.log('Tutor not found');
            return;
        }

        console.log(`Found Tutor: ${tutor.fullName} (${tutor.email})`);

        // Cascading delete manually if models not set up for middleware
        await User.findOneAndDelete({ email: tutor.email });
        console.log('Deleted User account');

        await Application.findOneAndDelete({ email: tutor.email });
        console.log('Deleted Application');

        await Tutor.findByIdAndDelete(TUTOR_ID);
        console.log('Deleted Tutor profile');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

deleteTutor();
