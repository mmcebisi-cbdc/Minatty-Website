const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Student = require('../models/Student');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
            callbackURL: '/api/auth/google/callback', // the relative path is resolved against the proxy if active
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists in our db with the given email
                const email = profile.emails[0].value;
                let user = await User.findOne({ email });

                if (user) {
                    // Update googleId if it was not set previously
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                    return done(null, user);
                }

                // If not, create a new user (default to student role)
                user = new User({
                    name: profile.displayName,
                    email: email,
                    // random password for oauth users since password is required by model, 
                    // though they won't use it to login directly
                    password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
                    role: 'student',
                    googleId: profile.id
                });

                await user.save();

                // Create a student profile
                const student = new Student({
                    user: user._id,
                    grade: '10', // Default
                });
                await student.save();

                done(null, user);
            } catch (err) {
                console.error('Error in Google Strategy:', err);
                done(err, null);
            }
        }
    )
);

module.exports = passport;
