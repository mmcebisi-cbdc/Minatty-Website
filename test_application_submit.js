const { openAsBlob } = require('fs');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/applications';

async function runTest() {
    console.log('Testing Application Submission (Native Node)...');

    const dummyImgPath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(dummyImgPath, 'dummy image content');

    try {
        const form = new FormData();
        // Use a fixed email to trigger duplicate error on second run
        const email = 'duplicate_test@example.com';
        form.append('fullName', 'Test Tutor Native');
        form.append('email', email);
        form.append('phone', '0123456789');
        form.append('qualification', 'bachelors');
        form.append('experience', '1-3');
        form.append('preferredRate', '250');
        form.append('location', 'Cape Town');
        form.append('bio', 'I am a test tutor.');

        // Append array fields
        form.append('subjects', 'Math');
        form.append('subjects', 'Science');
        form.append('teachingFormat', 'online');

        // Append files using blobs
        // Note: openAsBlob returns a Promise<Blob>
        // But for Node < 20 it might not exist. Node 24 definitely has it.
        // Actually it is fs.openAsBlob (available since v19.8.0)

        // Create Blob with correct MIME type to pass multer filter
        const buffer = fs.readFileSync(dummyImgPath);
        const blob = new Blob([buffer], { type: 'image/jpeg' });

        // FormData.append(name, value, filename)
        form.append('profileImage', blob, 'profile.jpg');
        form.append('qualificationsDoc', blob, 'qualifications.jpg');
        form.append('identityDoc', blob, 'id.jpg');

        const response = await fetch(API_URL, {
            method: 'POST',
            body: form
        });

        const text = await response.text();
        console.log('Response Status:', response.status);
        console.log('Response Body:', text);

        if (response.ok) {
            console.log('SUCCESS: Application submitted.');
        } else {
            console.error('FAILURE: ' + text);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);
    }
}

runTest();
