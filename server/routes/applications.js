const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Tutor = require('../models/Tutor');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Multer for file uploads (Dynamic: Cloudinary or Local)
let storage;

if (process.env.CLOUDINARY_URL) {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'minatty_uploads',
            allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'pdf']
        },
    });
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, 'tutor-' + Date.now() + path.extname(file.originalname));
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDFs are allowed'));
    }
});

// @route   POST /api/applications
// @desc    Submit a tutor application with image and documents
// @access  Public
router.post('/', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'qualificationsDoc', maxCount: 1 },
    { name: 'identityDoc', maxCount: 1 }
]), async (req, res) => {
    console.log('📝 Received application submission request');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    try {
        const {
            fullName,
            email,
            phone,
            qualification,
            subjects,
            experience,
            preferredRate,
            location,
            teachingFormat,
            workExperience,
            bio
        } = req.body;

        // Check if application already exists
        const existingApp = await Application.findOne({ email });
        if (existingApp) {
            return res.status(400).json({ error: 'Application with this email already exists' });
        }

        // Parse array fields if they come as strings (from FormData)
        let parsedSubjects = subjects;
        if (typeof subjects === 'string') {
            parsedSubjects = subjects.split(',').filter(s => s.trim() !== '');
        } else if (!subjects) {
            parsedSubjects = [];
        }

        let parsedFormat = teachingFormat;
        if (typeof teachingFormat === 'string') {
            parsedFormat = teachingFormat.split(',').filter(s => s.trim() !== '');
        } else if (!teachingFormat) {
            parsedFormat = [];
        }

        // Get file paths (Cloudinary provides full URL in .path, DiskStorage provides .filename)
        const getFilePath = (fileArray) => {
            if (!fileArray || fileArray.length === 0) return '';
            const file = fileArray[0];
            if (file.path && file.path.startsWith('http')) {
                return file.path; // Cloudinary URL
            }
            return `/uploads/${file.filename}`; // Local File Fallback
        };

        const profileImage = getFilePath(req.files['profileImage']);
        const qualificationsDoc = getFilePath(req.files['qualificationsDoc']);
        const identityDoc = getFilePath(req.files['identityDoc']);

        // Create new application
        const application = new Application({
            fullName,
            email,
            phone,
            qualification,
            subjects: parsedSubjects,
            experience,
            preferredRate,
            location,
            teachingFormat: parsedFormat,
            workExperience,
            bio,
            profileImage,
            qualificationsDoc,
            identityDoc
        });

        await application.save();

        res.status(201).json({
            message: 'Application submitted successfully!',
            applicationId: application._id
        });
    } catch (err) {
        console.error('Error submitting application:', err);
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/applications
// @desc    Get all applications (admin only)
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const applications = await Application.find(query).sort({ submittedAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json(application);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status & create tutor if approved
// @access  Private
router.put('/:id/status', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const applicationId = req.params.id;

        const application = await Application.findByIdAndUpdate(
            applicationId,
            {
                status,
                adminNotes,
                reviewedAt: Date.now()
            },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (status === 'approved') {
            // Check if tutor already exists
            let tutor = await Tutor.findOne({ email: application.email });

            // Determine grade levels based on subjects
            let gradeLevels = [];
            if (application.subjects) {
                application.subjects.forEach(sub => {
                    const subjectLower = sub.toLowerCase();
                    if (subjectLower.includes('primary')) {
                        gradeLevels.push('4', '5', '6', '7');
                    }
                    if (subjectLower.includes('hs') || subjectLower.includes('high school')) {
                        gradeLevels.push('8', '9', '10', '11', '12');
                    }
                    // Keep existing check just in case specific grades are ever sent
                    if (sub.includes('10')) gradeLevels.push('10');
                    if (sub.includes('11')) gradeLevels.push('11');
                    if (sub.includes('12')) gradeLevels.push('12');
                });
                gradeLevels = [...new Set(gradeLevels)]; // Remove duplicates
            }


            const tutorData = {
                fullName: application.fullName,
                email: application.email,
                phone: application.phone,
                profileImage: application.profileImage,
                qualification: application.qualification,
                subjects: application.subjects,
                gradeLevel: gradeLevels.length > 0 ? gradeLevels : ['8', '9', '10', '11', '12'],
                experience: application.experience,
                workExperience: application.workExperience,
                bio: application.bio,
                hourlyRate: application.preferredRate,
                teachingFormat: application.teachingFormat,
                location: {
                    city: application.location,
                    province: 'Gauteng' // Default or extract if added to form
                },
                status: 'approved',
                verified: true
            };

            if (tutor) {
                // Update existing tutor
                await Tutor.findOneAndUpdate({ email: application.email }, tutorData);
                console.log(`Updated existing tutor profile for ${application.fullName}`);
            } else {
                // Create new tutor
                const newTutor = new Tutor(tutorData);
                await newTutor.save();
                console.log(`Created new tutor profile for ${application.fullName}`);
            }
        }

        res.json({ message: 'Application status updated', application });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ error: err.message });
    }
});

// @route   DELETE /api/applications/:id
// @desc    Delete application
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Delete associated Tutor profile if it exists
        await Tutor.findOneAndDelete({ email: application.email });
        console.log(`Deleted tutor profile for ${application.email}`);

        await Application.findByIdAndDelete(req.params.id);

        res.json({ message: 'Application and associated tutor profile deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
