# TutorConnect Server

Backend server for the TutorConnect tutoring platform.

## Features

- RESTful API for tutors, bookings, and applications
- MongoDB database with Mongoose ORM
- JWT-based authentication
- CORS enabled for frontend integration
- Express.js backend framework

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tutorconnect
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Tutors
- `GET /api/tutors` - Get all tutors (with filters: subject, grade, format, minRate, maxRate, location, sortBy)
- `GET /api/tutors/:id` - Get tutor by ID
- `POST /api/tutors/:id/review` - Add a review to a tutor

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status

### Applications
- `POST /api/applications` - Submit tutor application
- `GET /api/applications` - Get all applications (admin)
- `GET /api/applications/:id` - Get application by ID
- `PUT /api/applications/:id/status` - Update application status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Database Models

### Tutor
- Personal information (name, email, phone, profile image)
- Academic qualifications
- Teaching information (subjects, experience, bio)
- Pricing & availability
- Reviews & ratings
- Verification status

### Booking
- Student information
- Tutor reference
- Booking details (subject, grade, session type)
- Scheduling (date, time, duration)
- Payment information

### Application
- Personal & academic information
- Teaching preferences
- Application status
- Admin notes

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Notes

- MongoDB must be installed and running locally or use MongoDB Atlas
- JWT secret should be a strong random string in production
- Email functionality requires SMTP configuration (currently commented out)
- For production, implement proper authentication middleware and validation
