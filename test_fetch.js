const http = require('http');

http.get('http://localhost:5000/api/tutors', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const tutors = JSON.parse(data);
        if (tutors.length === 0) { console.log('no tutors'); return; }
        const id = tutors[0]._id;
        console.log('Fetching', id);
        
        http.get('http://localhost:5000/api/tutors/' + id, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                const t = JSON.parse(data2);
                console.log('Tutor subjects isArray?', Array.isArray(t.subjects), typeof t.subjects);
                console.log('Tutor gradeLevel isArray?', Array.isArray(t.gradeLevel), typeof t.gradeLevel);
            });
        });
    });
});
