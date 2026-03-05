const mongoose = require('mongoose');
require('dotenv').config();
const Tutor = require('./models/Tutor');
const Application = require('./models/Application');

async function fixTutorStatuses() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // 1. Find all APPROVED applications
        const approvedApps = await Application.find({ status: 'approved' });
        console.log(`Found ${approvedApps.length} approved applications.`);

        for (const app of approvedApps) {
            console.log(`Checking tutor for application: ${app.email}`);

            // 2. Find corresponding Tutor
            const tutor = await Tutor.findOne({ email: app.email });

            if (tutor) {
                if (tutor.status !== 'approved' || !tutor.verified) {
                    console.log(`Fixing status/verification for ${tutor.fullName}...`);
                    tutor.status = 'approved';
                    tutor.verified = true;
                    // Also sync profile image if missing on tutor but present on app
                    if (!tutor.profileImage && app.profileImage) {
                        tutor.profileImage = app.profileImage;
                    }
                    if (!tutor.subjects || tutor.subjects.length === 0) {
                        tutor.subjects = app.subjects;
                    }
                    if (!tutor.hourlyRate) {
                        tutor.hourlyRate = app.preferredRate;
                    }

                    await tutor.save();
                    console.log(`✅ Fixed: ${tutor.fullName}`);
                } else {
                    console.log(`- Already correct: ${tutor.fullName}`);
                }
            } else {
                console.log(`⚠️ No tutor profile found for ${app.email} (creating one now...)`);
                // Reuse logic from route (simplified here)
                const newTutor = new Tutor({
                    fullName: app.fullName,
                    email: app.email,
                    phone: app.phone,
                    profileImage: app.profileImage,
                    qualification: app.qualification,
                    subjects: app.subjects,
                    gradeLevel: ['8', '9', '10', '11', '12'], // Default
                    experience: app.experience,
                    bio: app.bio,
                    hourlyRate: app.preferredRate,
                    teachingFormat: app.teachingFormat,
                    status: 'approved',
                    verified: true
                });
                await newTutor.save();
                console.log(`✅ Created: ${app.fullName}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixTutorStatuses();
