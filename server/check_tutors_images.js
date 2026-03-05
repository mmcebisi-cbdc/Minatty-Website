const mongoose = require('mongoose');
const Tutor = require('./models/Tutor');

mongoose.connect('mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const tutors = await Tutor.find({ status: 'approved' });
    console.log('Approved Tutors:');
    tutors.forEach(t => {
        console.log(`- ${t.fullName}`);
        console.log(`  Profile Image: ${t.profileImage}`);
        console.log(`  Subjects: ${t.subjects}`);
        console.log(`  Grade Level: ${t.gradeLevel}`);
        console.log(`  Hourly Rate: ${t.hourlyRate}`);
        console.log(`  Rating: ${t.rating}`);
        console.log(`  Total Reviews: ${t.totalReviews}`);
    });
    mongoose.disconnect();
}).catch(err => {
    console.error(err);
    mongoose.disconnect();
});
