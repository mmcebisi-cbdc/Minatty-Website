const axios = require('axios');

async function createTestUser() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: "Test Student",
            email: "test@example.com",
            password: "password123",
            role: "student"
        });
        console.log('User created:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

createTestUser();
