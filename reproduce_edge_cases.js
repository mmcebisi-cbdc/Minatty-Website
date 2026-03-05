const fs = require('fs');
const path = require('path');
const { openAsBlob } = require('fs');

const API_URL = 'http://localhost:5000/api/applications';
const dummyImgPath = path.join(__dirname, 'dummy_edge.jpg');
fs.writeFileSync(dummyImgPath, 'dummy image content');

async function testSubmission(name, payloadOverrides) {
    console.log(`\n--- Testing ${name} ---`);
    const form = new FormData();

    // Default Payload
    const defaults = {
        fullName: 'Test Edge',
        email: `edge_${Date.now()}@example.com`,
        phone: '0821234567',
        qualification: 'bachelors',
        experience: '1-3',
        preferredRate: '250',
        location: 'Cape Town',
        bio: 'Test bio',
        subjects: ['Math'],
        teachingFormat: ['online'],
        files: true
    };

    const payload = { ...defaults, ...payloadOverrides };

    // Append standard fields
    for (const key of ['fullName', 'email', 'phone', 'qualification', 'experience', 'preferredRate', 'location', 'bio']) {
        if (payload[key] !== undefined) form.append(key, payload[key]);
    }

    // Append arrays
    if (payload.subjects) {
        if (Array.isArray(payload.subjects)) {
            payload.subjects.forEach(s => form.append('subjects', s));
        } else {
            form.append('subjects', payload.subjects);
        }
    }

    if (payload.teachingFormat) {
        if (Array.isArray(payload.teachingFormat)) {
            payload.teachingFormat.forEach(s => form.append('teachingFormat', s));
        } else {
            form.append('teachingFormat', payload.teachingFormat);
        }
    }

    // Append files
    if (payload.files) {
        const buffer = fs.readFileSync(dummyImgPath);
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        form.append('profileImage', blob, 'profile.jpg');
        form.append('qualificationsDoc', blob, 'qualifications.jpg');
        form.append('identityDoc', blob, 'id.jpg');
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: form
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        if (!response.ok) {
            console.log(`Error Body: ${text}`);
        } else {
            console.log('Success');
        }
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

async function run() {
    // Test 1: Single Subject
    await testSubmission('Single Subject', { subjects: ['Math'] });

    // Test 2: Multiple Subjects
    await testSubmission('Multiple Subjects', { subjects: ['Math', 'Science'] });

    // Test 3: No Subjects (Frontend blocks this, but backend might crash?)
    // Note: Mongoose might fail validation
    await testSubmission('No Subjects', { subjects: [] });

    // Test 4: Missing File
    // Backend doesn't strictly require files in schema logic (defaults to empty string), but let's see.
    await testSubmission('No Files', { files: false });

    // Cleanup
    if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);
}

run();
