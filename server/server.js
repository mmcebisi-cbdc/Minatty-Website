const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../')));
// Serve images from js/images/ at the /images/ path
app.use('/images', express.static(path.join(__dirname, '../js/images')));
// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const tutorRoutes = require('./routes/tutors');
const bookingRoutes = require('./routes/bookings');
const applicationRoutes = require('./routes/applications');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

// Use routes
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.message === 'Only images and PDFs are allowed') {
        return res.status(400).json({ error: err.message });
    }
    // Multer size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max limit is 10MB.' });
    }
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TutorConnect server running on port ${PORT}`);
    console.log(`📚 Access the website at http://localhost:${PORT}`);
});
