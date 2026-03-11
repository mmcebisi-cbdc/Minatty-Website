const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('../models/User');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');

const passport = require('passport');

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback endpoint
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html?error=google_auth_failed' }),
    async (req, res) => {
        try {
            // User is successfully authenticated via Google. req.user holds the user object
            const user = req.user;

            // Build the payload 
            let userResponse = { id: user.id, name: user.name, email: user.email, role: user.role };

            // Append profile data
            if (user.role === 'student') {
                const student = await Student.findOne({ user: user._id });
                if (student) userResponse = { ...userResponse, ...student.toObject() };
            } else if (user.role === 'tutor') {
                const tutor = await Tutor.findOne({ email: user.email });
                if (tutor) userResponse = { ...userResponse, ...tutor.toObject() };
            }

            const payload = {
                user: { id: user.id, role: user.role }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' },
                (err, token) => {
                    if (err) throw err;
                    // Provide the token and user to the frontend via URL parameters 
                    // Since it's a GET request initiated by the browser redirect, we MUST redirect
                    // to a specific frontend screen to finalize and store the token.
                    const redirectUrl = process.env.NODE_ENV === 'production'
                        ? 'https://minatty-hub.vercel.app/oauth-callback.html'
                        : 'http://localhost:5000/oauth-callback.html';

                    // Using URL-safe string encoding
                    res.redirect(`${redirectUrl}?token=${token}`);
                }
            );
        } catch (err) {
            console.error('Google Callback Error:', err.message);
            res.redirect('/login.html?error=server_error');
        }
    }
);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, ...profileData } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            phoneNumber: profileData.phone || '',
            parentGuardianNumber: profileData.parentGuardianNumber || ''
        });

        await user.save();

        let userResponse = { id: user.id, name: user.name, email: user.email, role: user.role };

        // Create specific profile based on role
        if (role === 'student') {
            const student = new Student({
                user: user._id,
                grade: profileData.grade || '10', // Default if not provided
                school: profileData.school || '',
                subjectsOfInterest: profileData.subjects || []
            });
            await student.save();
            userResponse = { ...userResponse, ...student.toObject() };
        } else if (role === 'tutor') {
            const tutor = new Tutor({
                fullName: name,
                email: email,
                phone: profileData.phone || '',
                qualification: profileData.qualification || 'currently-studying',
                subjects: profileData.subjects || [],
                experience: profileData.experience || '0-1',
                bio: profileData.bio || 'New tutor',
                hourlyRate: profileData.hourlyRate || 100,
                status: 'pending' // Tutors need approval
            });
            await tutor.save();
            userResponse = { ...userResponse, ...tutor.toObject() };
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    user: userResponse
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        let userResponse = { id: user.id, name: user.name, email: user.email, role: user.role };

        // Fetch profile data
        if (user.role === 'tutor') {
            const tutor = await Tutor.findOne({ email: user.email });
            if (tutor) {
                userResponse = { ...userResponse, ...tutor.toObject() };
            }
        } else if (user.role === 'student') {
            const student = await Student.findOne({ user: user._id });
            if (student) {
                userResponse = { ...userResponse, ...student.toObject() };
            }
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    message: 'Login successful',
                    token,
                    user: userResponse
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// @route   POST /api/auth/verify-admin
// @desc    Verify admin password
// @access  Public
router.post('/verify-admin', (req, res) => {
    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {
        // Create a simple token or just return success
        // For simplicity in this non-database-user admin:
        return res.json({ success: true, message: 'Admin verified' });
    }

    return res.status(401).json({ error: 'Invalid password' });
});

// @route   GET /api/auth/users
// @desc    Get all registered users with details
// @access  Public (for admin dashboard simplicity, ideally protected)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        const usersWithDetails = await Promise.all(users.map(async (user) => {
            let userObj = user.toObject();
            if (user.role === 'student') {
                const student = await Student.findOne({ user: user._id });
                if (student) {
                    userObj.grade = student.grade;
                }
            }
            return userObj;
        }));

        res.json(usersWithDetails);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate token
        const crypto = require('crypto');
        const token = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // In a real app, send email here. For now, return token.
        // const resetUrl = `http://localhost:5000/reset-password.html?token=${token}`;

        console.log(`Password reset token for ${email}: ${token}`);

        res.json({
            message: 'Email sent',
            // returning token for demo purposes only
            demoToken: token
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user and related profiles
// @access  Public
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Cascading Delete Logic
        if (user.role === 'tutor') {
            await Tutor.findOneAndDelete({ email: user.email });
            await require('../models/Application').findOneAndDelete({ email: user.email }); // Assuming application uses same email
        } else if (user.role === 'student') {
            await Student.findOneAndDelete({ user: user._id });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and related profiles deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error deleting user' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let userResponse = { id: user.id, name: user.name, email: user.email, role: user.role, hasUsedTrial: user.hasUsedTrial };

        // Fetch profile data
        if (user.role === 'tutor') {
            const tutor = await Tutor.findOne({ email: user.email });
            if (tutor) {
                userResponse = { ...userResponse, ...tutor.toObject() };
            }
        } else if (user.role === 'student') {
            const student = await Student.findOne({ user: user._id });
            if (student) {
                userResponse = { ...userResponse, ...student.toObject() };
            }
        }

        res.json(userResponse);
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
});

module.exports = router;
