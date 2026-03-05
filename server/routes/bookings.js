const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Tutor = require('../models/Tutor');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { studentName, studentEmail, tutorId, subject, date, message, lessonType, lessonFormat, paymentStatus, paymentMethod, transactionId, amount } = req.body;

        const tutor = await Tutor.findById(tutorId);
        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        // Logic for Trial Lesson eligibility would go here if we had the user ID in the request
        // For now, we rely on the frontend to send the correct lessonType and paymentStatus

        const booking = new Booking({
            studentName,
            studentEmail,
            tutor: tutorId,
            subject,
            date,
            message,
            lessonType: lessonType || 'regular',
            lessonFormat: lessonFormat || 'online',
            paymentStatus: paymentStatus || 'pending',
            paymentMethod: paymentMethod || 'none',
            transactionId,
            amount
        });

        await booking.save();

        // Update User's trial status if applicable (assuming we can link by email for now, or if userId was sent)
        // In a real app, req.user would be available via middleware
        if (lessonType === 'trial' && paymentStatus === 'paid') {
            // Find user by email and update hasUsedTrial
            const User = require('../models/User');
            // Ensure email matches the lowercase format stored in User model
            const emailToLower = studentEmail.toLowerCase();
            await User.findOneAndUpdate({ email: emailToLower }, { hasUsedTrial: true });
        }

        res.status(201).json({
            message: 'Booking request processed successfully!',
            booking
        });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/bookings
// @desc    Get all bookings (Admin/Tutor view)
// @access  Public (Should be protected in real app)
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('tutor', 'fullName email') // Get tutor name and email
            .sort({ date: 1 }); // Sort by upcoming dates

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Public
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/bookings/create-payment-intent
// @desc    Create a payment intent (Stripe/PayPal placeholder)
// @access  Public
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency, paymentMethod } = req.body;

        // In a real application, you would generate a payment intent using Stripe or PayPal SDKs here.
        // For now, we return a mock success response.

        const clientSecret = 'mock_client_secret_' + Math.random().toString(36).substring(7);

        res.json({
            clientSecret,
            message: 'Payment intent created successfully'
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
