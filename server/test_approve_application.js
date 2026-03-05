const mongoose = require('mongoose');

async function approveApplication() {
    // 1. Find the application ID first
    // We'll use mongoose here to get the ID, then use fetch to call the API
    const Application = require('./models/Application');

    await mongoose.connect('mongodb://localhost:27017/minatty', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const app = await Application.findOne({ email: /test_work_exp/ }).sort({ submittedAt: -1 });

    if (!app) {
        console.error('No test application found');
        process.exit(1);
    }

    console.log(`Approving application: ${app.email} (${app._id})`);

    try {
        // Use native fetch (available in Node 20+)
        const response = await fetch(`http://localhost:5000/api/applications/${app._id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                adminNotes: 'Approved via test script'
            })
        });

        const data = await response.json();
        console.log('API Response:', response.status, data);

        // Verify transfer
        const Tutor = require('./models/Tutor');
        const tutor = await Tutor.findOne({ email: app.email });

        if (tutor) {
            console.log('--- Tutor Verification ---');
            console.log(`Name: ${tutor.fullName}`);
            console.log(`Work Experience: ${tutor.workExperience}`);
            if (tutor.workExperience === app.workExperience) {
                console.log('✅ SUCCESS: Work Experience transferred correctly.');
            } else {
                console.error('❌ FAILURE: Work Experience mismatch.');
                console.log(`Expected: ${app.workExperience}`);
                console.log(`Actual: ${tutor.workExperience}`);
            }
        } else {
            console.error('❌ FAILURE: Tutor profile not created.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

approveApplication();
