const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');

// @route   GET /api/tutors
// @desc    Get all tutors with optional filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { subject, grade, format, minRate, maxRate, location, sortBy } = req.query;

        let query = { $or: [{ status: 'approved' }, { verified: true }] };

        // Apply filters
        console.log('GET /api/tutors query params:', req.query);
        if (subject) query.subjects = new RegExp(subject, 'i');
        if (grade) query.gradeLevel = grade;
        if (format) query.teachingFormat = format;
        if (location) query['location.city'] = new RegExp(location, 'i');
        if (minRate || maxRate) {
            query.hourlyRate = {};
            if (minRate) query.hourlyRate.$gte = Number(minRate);
            if (maxRate) query.hourlyRate.$lte = Number(maxRate);
        }

        // Default sort by rating
        let sort = { rating: -1 };
        if (sortBy === 'price-low') sort = { hourlyRate: 1 };
        if (sortBy === 'price-high') sort = { hourlyRate: -1 };
        if (sortBy === 'reviews') sort = { totalReviews: -1 };

        console.log('Constructed Mongo Query:', JSON.stringify(query));
        const tutors = await Tutor.find(query).sort(sort);
        console.log(`Found ${tutors.length} tutors`);
        res.json(tutors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/tutors/:id
// @desc    Get tutor by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const tutor = await Tutor.findById(req.params.id);
        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }
        res.json(tutor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/tutors/:id/review
// @desc    Add a review to a tutor
// @access  Public
router.post('/:id/review', async (req, res) => {
    try {
        const { studentName, rating, comment, subject } = req.body;

        const tutor = await Tutor.findById(req.params.id);
        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        // Add review
        tutor.reviews.push({ studentName, rating, comment, subject });

        // Update average rating
        const totalRating = tutor.reviews.reduce((sum, review) => sum + review.rating, 0);
        tutor.rating = totalRating / tutor.reviews.length;
        tutor.totalReviews = tutor.reviews.length;

        await tutor.save();
        res.json({ message: 'Review added successfully', tutor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   DELETE /api/tutors/:id
// @desc    Delete tutor and related profiles
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const tutor = await Tutor.findById(req.params.id);
        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        const email = tutor.email;

        // Delete User account
        await require('../models/User').findOneAndDelete({ email });

        // Delete Application
        await require('../models/Application').findOneAndDelete({ email });

        // Delete Tutor profile
        await Tutor.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tutor profile and account deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
