const mongoose = require('mongoose');
const Tutor = require('./server/models/Tutor');

async function testValidation() {
    try {
        const tutor = new Tutor({
            fullName: 'Test Tutor',
            email: 'test@tutor.com',
            phone: '1234567890',
            qualification: 'bachelors',
            subjects: [], // Testing empty array
            experience: '0-1',
            bio: 'Test Bio',
            hourlyRate: 150
        });

        await tutor.validate();
        console.log('Validation passed!');
    } catch (err) {
        console.error('Validation failed:', err.message);
    }
}

testValidation();
