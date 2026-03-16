const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');

// ── MongoDB Connection ────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI environment variable is not set!');
    console.error('   On Render: Dashboard → your service → Environment → Add MONGODB_URI');
    console.error('   Falling back to localhost (will FAIL on cloud servers like Render)');
}

let dbConnected = false;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minatty', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
})
    .then(() => {
        dbConnected = true;
        console.log('✅ MongoDB Connected to:', process.env.MONGODB_URI ? 'Atlas (cloud)' : 'localhost (fallback)');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection FAILED:', err.message);
        console.error('   Full error details:', JSON.stringify(err, null, 2));
    });


// Middleware
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5500',  // Live Server (VS Code)
    'https://minatty-hub.vercel.app',
    /^https:\/\/minatty-.*\.vercel\.app$/ // Any Vercel preview deployments
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowed =>
            typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: origin ${origin} not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');

// Require the passport configuration
require('./config/passport');

app.use(session({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '../')));
// Serve images from images/ at the /images/ path
app.use('/images', express.static(path.join(__dirname, '../images')));
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

// ── Health Check (visit /api/health to diagnose DB + env issues) ──────────────
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: dbState === 1 ? 'ok' : 'degraded',
        database: states[dbState] || 'unknown',
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? '✅ set' : '❌ MISSING',
            JWT_SECRET: process.env.JWT_SECRET ? '✅ set' : '❌ MISSING',
            ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? '✅ set' : '❌ MISSING',
            CLOUDINARY_URL: process.env.CLOUDINARY_URL ? '✅ set' : '❌ MISSING (Optional but recommended for images)',
            PORT: process.env.PORT || '(default 5000)'
        },
        timestamp: new Date().toISOString()
    });
});

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
    // Cloudinary/Multer errors
    if (err.message && err.message.includes('Cloudinary')) {
        console.error('☁️ Cloudinary Error:', err);
        return res.status(500).json({ error: 'Image upload failed. Please check Cloudinary configuration.' });
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
