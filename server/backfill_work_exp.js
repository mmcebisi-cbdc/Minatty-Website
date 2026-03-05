const mongoose = require('mongoose');
const Tutor = require('./models/Tutor');
const Application = require('./models/Application');

async function backfillWorkExperience() {
    try {
        await mongoose.connect('mongodb://localhost:27017/minatty', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const tutors = await Tutor.find({});
        console.log(`Found ${tutors.length} tutors.`);

        for (const tutor of tutors) {
            // Check if workExperience is missing or empty
            if (!tutor.workExperience) {
                console.log(`Checking tutor: ${tutor.fullName} (${tutor.email})`);

                // Find original application
                const app = await Application.findOne({ email: tutor.email });

                if (app && app.workExperience) {
                    console.log(`Found matching application with work experience: "${app.workExperience.substring(0, 30)}..."`);
                    tutor.workExperience = app.workExperience;
                    await tutor.save();
                    console.log('✅ Updated tutor profile from application.');
                } else {
                    console.log('No matching application with work experience found. Seeding sample data...');
                    const sampleExperiences = [
                        "5 years teaching Mathematics at Parktown Boys High.",
                        "Former lecturer at Wits University with 10 years experience.",
                        "Private tutor for 3 years specializing in Physical Science.",
                        "Head of Department for Mathematics at local high school.",
                        "Certified Kumon instructor with passion for early childhood development."
                    ];
                    tutor.workExperience = sampleExperiences[Math.floor(Math.random() * sampleExperiences.length)];
                    await tutor.save();
                    console.log(`✅ Seeded sample work experience: "${tutor.workExperience}"`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

backfillWorkExperience();
