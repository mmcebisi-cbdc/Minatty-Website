const mongoose = require('mongoose');
require('dotenv').config();
const Tutor = require('./models/Tutor');

const sampleTutors = [
    {
        fullName: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "0821234567",
        qualification: "honours",
        university: "UCT",
        subjects: ["mathematics-hs", "physical-science-hs"],
        gradeLevel: ["10", "11", "12"],
        experience: "3-5",
        bio: "Passionate about making science and math accessible to high school students. 5 years of experience producing top results.",
        hourlyRate: 250,
        teachingFormat: ["online", "in-person"],
        location: { city: "Johannesburg", province: "Gauteng" },
        status: "approved",
        verified: true,
        rating: 4.8,
        totalReviews: 12
    },
    {
        fullName: "Thabo Mokoena",
        email: "thabo.m@example.com",
        phone: "0719876543",
        qualification: "bachelors",
        university: "Wits",
        subjects: ["mathematics-primary", "coding-primary", "english-primary"],
        gradeLevel: ["4", "5", "6", "7"],
        experience: "1-3",
        bio: "Specializing in building strong foundations for primary school learners. Patient and engaging teaching style.",
        hourlyRate: 180,
        teachingFormat: ["online"],
        location: { city: "Pretoria", province: "Gauteng" },
        status: "approved",
        verified: true,
        rating: 4.5,
        totalReviews: 8
    },
    {
        fullName: "Emily Davis",
        email: "emily.d@example.com",
        phone: "0635557788",
        qualification: "masters",
        university: "Stellenbosch",
        subjects: ["english-hs", "afrikaans-hs", "history-hs"],
        gradeLevel: ["8", "9", "10", "11", "12"],
        experience: "5+",
        bio: "Experienced language tutor helping students excel in essay writing and literature analysis.",
        hourlyRate: 300,
        teachingFormat: ["online"],
        location: { city: "Cape Town", province: "Western Cape" },
        status: "approved",
        verified: true,
        rating: 5.0,
        totalReviews: 24
    }
];

async function seedTutors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Clear existing tutors to avoid duplicates if re-run
        // await Tutor.deleteMany({}); 
        // console.log('Cleared existing tutors');

        for (const tutorData of sampleTutors) {
            const exists = await Tutor.findOne({ email: tutorData.email });
            if (!exists) {
                const tutor = new Tutor(tutorData);
                await tutor.save();
                console.log(`Added tutor: ${tutor.fullName}`);
            } else {
                console.log(`Skipped existing tutor: ${tutorData.fullName}`);
            }
        }

        console.log('Seeding complete!');
    } catch (err) {
        console.error('Error seeding tutors:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedTutors();
