const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/user');
const PasswordResetToken = require('../models/PasswordResetToken');
const sendEmail = require('../utils/sendEmail');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const crypto = require('crypto');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub, given_name, family_name, email_verified } = ticket.getPayload();

        // 1. Email Verification Check
        if (!email_verified) {
            return res.status(400).json({ error: 'Google account email is not verified.' });
        }

        let user = await User.findOne({ email });

        if (user) {
            // User exists, convert them to a Google-authenticated user
            user.authProvider = 'google';
            user.providerId = sub;
            user.password = undefined; // Clear the local password
            user.firstName = given_name || user.firstName;
            user.lastName = family_name || user.lastName;
        } else {
            // If user does not exist, create a new one
            user = new User({
                firstName: given_name || '',
                lastName: family_name || '',
                email: email,
                authProvider: 'google',
                providerId: sub,
            });
        }

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        res.status(200).json({ token, user: userData });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
};


exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: 'Email not found' });
        }

        const isMatch = await bcryptjs.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // בונה את אובייקט המשתמש בלי הסיסמה
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            nickname: user.nickname,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ token, user: userData });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            // Create a secure, random token
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Hash the token before saving it to the database
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            await PasswordResetToken.findOneAndUpdate(
                { email },
                { token: hashedToken, expiresAt, used: false },
                { new: true, upsert: true }
            );

            const baseUrl = process.env.RESET_PASSWORD_BASE_URL || 'http://localhost:3000';
            // Send the unhashed token to the user
            const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
            const message = `
                <h1>You have requested a password reset</h1>
                <p>Please go to this link to reset your password:</p>
                <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
            `;

            // Whitelist logic for development environment
            const isDev = process.env.NODE_ENV === 'dev';
            const emailWhitelist = process.env.EMAIL_WHITELIST ? process.env.EMAIL_WHITELIST.split(',') : [];
            console.log('isDev',isDev);
            console.log('emailWhitelist',emailWhitelist);
            if (isDev && !emailWhitelist.includes(user.email)) {
                console.log(`Skipping password reset email for ${user.email} (not in whitelist for dev env).`);
            } else {
                try {
                    await sendEmail({
                        email: user.email,
                        subject: 'Password Reset Request',
                        html: message,
                    });
                    console.log('Password reset email sent to:', user.email);

                } catch (err) {
                    console.error('Email sending error:', err);
                    // Even if email fails, we don't want to leak info.
                    // The token is still in the DB for manual resend if needed.
                }
            }
        }

        res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }
        
        // Hash the incoming token to match the one in the DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await PasswordResetToken.findOne({ token: hashedToken });

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        const user = await User.findOne({ email: resetToken.email });
        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(newPassword, salt);
        
        user.authProvider = 'local';
        user.providerId = undefined; 
        
        await user.save();

        resetToken.used = true;
        await resetToken.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const User = require('../models/user');
// const {saveUser} = require("./usersController");
// require('dotenv').config();

// exports.registerUser = async (req, res) => {
//     const existingUser = await User.findOne({ name: req.body.username });
//     if (existingUser) {
//         return res.status(400).json({ error: 'Username already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(req.body.password, 10);
//     const newUser = new User({
//         name: req.body.username,
//         password: hashedPassword
//     });

//     try {
//         let saveUser = newUser.save();
//         console.log(saveUser)
//         const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.status(201).json({ token });
//     } catch (e) {
//         console.error(e);
//         res.status(500).json({ error: 'Failed to create user' });
//     }
// };

// exports.login = async (req, res) => {
//     const user = await User.findOne({ name: req.body.username });
//     if (!user) {
//         return res.status(400).json({ error: 'User name is not found' });
//     }
//     const isMatch = await bcrypt.compare(req.body.password, user.password);
//     if (!isMatch) {
//         return res.status(400).json({ error: 'Wrong password' });
//     }
//     const token = jwt.sign({ userId: user._id, userName: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.status(201).json({ token });
// };
