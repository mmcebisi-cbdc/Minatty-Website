// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'test_trial_' + Date.now() + '@example.com';
const PASSWORD = 'password123';

async function runTest() {
    console.log(`1. Registering user: ${EMAIL}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: EMAIL,
            password: PASSWORD,
            role: 'student'
        })
    });

    if (!regRes.ok) {
        console.error('Registration failed', await regRes.text());
        return;
    }
    const regData = await regRes.json();
    console.log('User registered. hasUsedTrial (from register):', regData.user.hasUsedTrial);

    // Login to get token (though we have it from register, let's allow clean flow)
    const token = regData.token;

    console.log('2. Checking initial status via /me...');
    const meRes1 = await fetch(`${API_URL}/auth/me`, {
        headers: { 'x-auth-token': token }
    });
    const meData1 = await meRes1.json();
    console.log('Current hasUsedTrial:', meData1.hasUsedTrial);

    if (meData1.hasUsedTrial) {
        console.error('ERROR: New user should have hasUsedTrial = false');
    }

    console.log('3. Booking a TRIAL lesson...');
    // We need a valid tutor ID. Let's fetch one.
    const tutorsRes = await fetch(`${API_URL}/tutors`);
    const tutors = await tutorsRes.json();
    if (tutors.length === 0) {
        console.error('No tutors found to book with.');
        return;
    }
    const tutorId = tutors[0]._id;

    const bookRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentName: 'Test User',
            studentEmail: EMAIL, // Using exact casing
            tutorId: tutorId,
            subject: 'Math',
            date: new Date().toISOString(),
            message: 'Test booking',
            lessonType: 'trial',
            paymentStatus: 'paid', // Simulate success
            paymentMethod: 'none',
            amount: 0
        })
    });

    if (!bookRes.ok) {
        console.error('Booking failed', await bookRes.text());
        return;
    }
    console.log('Booking successful.');

    console.log('4. Checking status after booking via /me...');
    const meRes2 = await fetch(`${API_URL}/auth/me`, {
        headers: { 'x-auth-token': token }
    });
    const meData2 = await meRes2.json();
    console.log('Final hasUsedTrial:', meData2.hasUsedTrial);

    if (meData2.hasUsedTrial === true) {
        console.log('SUCCESS: hasUsedTrial was updated to true.');
    } else {
        console.error('FAILURE: hasUsedTrial is still false.');
    }
}

runTest().catch(console.error);
