const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact — Submit a contact message
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const newMessage = new ContactMessage({ name, email, subject, message });
        await newMessage.save();

        res.status(201).json({ success: true, message: 'Message received! We will get back to you shortly.' });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Failed to save message. Please try again.' });
    }
});

// GET /api/contact — Get all messages (admin only)
router.get('/', async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// PUT /api/contact/:id/status — Mark as read or replied
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['unread', 'read', 'replied'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const updated = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Message not found.' });

        res.json({ success: true, message: updated });
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// DELETE /api/contact/:id — Delete a message
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Message not found.' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact message:', error);
        res.status(500).json({ error: 'Failed to delete message.' });
    }
});

module.exports = router;
