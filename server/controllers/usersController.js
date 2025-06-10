const jwt = require('jsonwebtoken');
const User = require("../models/user");
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res) => {
   try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            // אם המשתמש קיים אבל לא מאומת, אפשר לשקול לשלוח שוב מייל אימות
            // כרגע, נחזיר שגיאה פשוטה כדי למנוע דליפת מידע
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcryptjs.hash(req.body.password, 10);
        
        // 1. Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // 2. Hash the token for database storage
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            nickname: req.body.nickname,
            password: hashedPassword,
            role: req.body.role || 'end-user',
            verification_token: hashedToken // 3. Save the HASHED token
        });

        const savedUser = await newUser.save();
        
        // 4. Send verification email with the ORIGINAL token
        const baseUrl = process.env.RESET_PASSWORD_BASE_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
        const message = `
            <h1>Welcome to TimeTo!</h1>
            <p>Thank you for registering. Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
            <p>This link is valid for one hour.</p>
        `;

        // Whitelist logic for development environment
        const isDev = process.env.NODE_ENV === 'dev';
        const emailWhitelist = process.env.EMAIL_WHITELIST ? process.env.EMAIL_WHITELIST.split(',') : [];
        
        if (isDev && !emailWhitelist.includes(savedUser.email)) {
            console.log(`Skipping verification email for ${savedUser.email} (not in whitelist for dev env).`);
            // In dev, you might want to log the verification link to the console for easy testing
            console.log(`Verification URL for ${savedUser.email}: ${verificationUrl}`);
        } else {
            try {
                await sendEmail({
                    email: savedUser.email,
                    subject: 'Email Verification for TimeTo',
                    html: message,
                });
            } catch (err) {
                console.error('Email sending error during registration:', err);
            }
        }

        // 5. Respond with a success message, NOT a token
        res.status(201).json({ 
            message: 'ההרשמה הצליחה! אנא בדוק את תיבת המייל שלך כדי לאמת את החשבון.' 
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'ההרשמה למערכת נכשלה' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Exclude passwords from the result
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Securely hash the password only if a new one is provided
        if (updateData.password && updateData.password.length > 0) {
            updateData.password = await bcryptjs.hash(updateData.password, 10);
        } else {
            // Ensure the password is not overwritten with an empty value
            delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
