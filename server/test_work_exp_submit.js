const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer'); // Node.js Blob

async function submitApplication() {
    // In Node.js environment, we might need to construct FormData manually or use a polyfill if not fully supported,
    // but v24 should have it. However, handling file streams with native FormData can be tricky.
    // Let's try to use the native global FormData if available.

    if (typeof FormData === 'undefined') {
        console.error('FormData is not defined globally. Verification might fail if running on older Node.');
        return;
    }

    const form = new FormData();
    form.append('fullName', 'Test Work Experience User');
    form.append('email', 'test_work_exp_' + Date.now() + '@example.com'); // Unique email
    form.append('phone', '0821234567');
    form.append('qualification', 'bachelors');
    form.append('subjects', 'mathematics-primary');
    form.append('experience', '5+');
    form.append('preferredRate', '300');
    form.append('location', 'Test City');
    form.append('teachingFormat', 'online');
    form.append('bio', 'Test bio');
    form.append('workExperience', '10 years of teaching math at High School level.');

    // Create dummy file
    fs.writeFileSync('dummy.txt', 'dummy content');
    const fileBuffer = fs.readFileSync('dummy.txt');
    const imageBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const pdfBlob = new Blob([fileBuffer], { type: 'application/pdf' });

    form.append('profileImage', imageBlob, 'profile.jpg');
    form.append('qualificationsDoc', pdfBlob, 'qual.pdf');
    form.append('identityDoc', pdfBlob, 'id.pdf');

    try {
        console.log('Submitting application...');
        // Use native fetch
        const response = await fetch('http://localhost:5000/api/applications', {
            method: 'POST',
            body: form
        });

        const data = await response.json();
        console.log('Response:', response.status, data);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (fs.existsSync('dummy.txt')) fs.unlinkSync('dummy.txt');
    }
}

submitApplication();
