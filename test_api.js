const axios = require('axios');

async function testFetchTutors() {
    try {
        const res = await axios.get('http://localhost:5000/api/tutors');
        console.log('Tutors received:', res.data.length);
        if (res.data.length > 0) {
            console.log('First tutor data:', JSON.stringify(res.data[0], null, 2));
        }
    } catch (err) {
        console.error('Error fetching tutors:', err.message);
    }
}

testFetchTutors();
