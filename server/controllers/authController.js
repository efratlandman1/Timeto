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


// Handles both registration and login for local accounts
exports.handleAuth = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "דוא'ל וסיסמה נדרשים." });
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // User exists, so attempt to log in
            if (existingUser.authProvider !== 'local') {
                return res.status(401).json({ error: 'נא להתחבר באמצעות ' + existingUser.authProvider });
            }

            if (!existingUser.is_verified) {
                // Here you could add logic to resend verification email if needed
                return res.status(403).json({
                    error: 'יש לאמת את כתובת המייל לפני שניתן להתחבר.',
                    code: 'EMAIL_NOT_VERIFIED'
                });
            }

            const isMatch = await bcryptjs.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'סיסמה שגויה' });
            }

            const token = jwt.sign({ userId: existingUser._id, email: existingUser.email, role: existingUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const userData = {
                id: existingUser._id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                role: existingUser.role,
            };
            return res.status(200).json({ token, user: userData, action: 'login' });

        } else {
            // User does not exist, so create a new user (register)
            if (!firstName) {
                return res.status(400).json({ error: "שם פרטי הוא שדה חובה." });
            }

            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(password, salt);
            
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

            const newUser = new User({
                email,
                password: hashedPassword,
                firstName,
                lastName: lastName || '',
                verification_token: hashedVerificationToken,
                is_verified: false,
                authProvider: 'local'
            });

            await newUser.save();

            const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
            const emailHtml = `<p>ברוך הבא! אנא לחץ על הקישור הבא כדי לאמת את חשבונך: <a href="${verificationUrl}">${verificationUrl}</a></p>`;
            
            await sendEmail({
                email: newUser.email,
                subject: 'אימות כתובת דוא"ל',
                html: emailHtml,
            });

            return res.status(201).json({ message: 'משתמש נוצר. נשלח אימייל אימות.', action: 'register' });
        }
    } catch (err) {
        console.error('Auth handling error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
};


// Handles Google login
exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub, given_name, family_name, email_verified } = ticket.getPayload();

        if (!email_verified) {
            return res.status(400).json({ error: 'Google account email is not verified.' });
        }

        let user = await User.findOne({ email });

        if (user) {
            user.authProvider = 'google';
            user.providerId = sub;
            user.password = undefined; 
            user.is_verified = true;
            user.firstName = given_name || user.firstName;
            user.lastName = family_name || user.lastName;
        } else {
            user = new User({
                firstName: given_name || '',
                lastName: family_name || '',
                email: email,
                authProvider: 'google',
                providerId: sub,
                is_verified: true,
            });
        }

        await user.save();

        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

// Verifies the email token and redirects user to set their password
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/set-password?error=invalid_token`);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ verification_token: hashedToken });

        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/set-password?error=invalid_token`);
        }
        
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/set-password?token=${token}`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/set-password?error=server_error`);
    }
};

// Sets the password for a new user after they have verified their email
exports.setPasswordAfterVerification = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'אסימון וסיסמה נדרשים.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ verification_token: hashedToken });

        if (!user) {
            return res.status(400).json({ error: 'אסימון אימות שגוי או פג תוקף.' });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(password, salt);
        user.is_verified = true;
        user.verification_token = undefined;
        
        await user.save();

        const jwtToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };
        res.status(200).json({ token: jwtToken, user: userData, message: 'הסיסמה נקבעה בהצלחה והינך מחובר.' });
    } catch (err) {
        console.error('Set password error:', err);
        res.status(500).json({ error: 'שגיאת שרת.' });
    }
};


// Sends a password reset link to the user's email
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            await PasswordResetToken.findOneAndUpdate(
                { email },
                { token: hashedToken, expiresAt, used: false },
                { new: true, upsert: true }
            );

            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            const message = `
                <h1>ביקשת איפוס סיסמה</h1>
                <p>אנא לחץ על הקישור הבא כדי לאפס את סיסמתך:</p>
                <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                <p>תוקף הקישור יפוג בעוד שעה.</p>
            `;
            
            await sendEmail({
                email: user.email,
                subject: 'בקשה לאיפוס סיסמה',
                html: message,
            });
        }
        
        res.status(200).json({ message: 'אם קיים משתמש עם כתובת אימייל זו, נשלח אליו קישור לאיפוס סיסמה.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
};

// Resets the password using a valid token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'אסימון וסיסמה חדשה נדרשים.' });
        }
        
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetTokenDoc = await PasswordResetToken.findOne({ token: hashedToken });

        if (!resetTokenDoc || resetTokenDoc.used || resetTokenDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'האסימון שגוי או פג תוקף.' });
        }

        const user = await User.findOne({ email: resetTokenDoc.email });
        if (!user) {
            return res.status(400).json({ message: 'לא נמצא משתמש.' });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(newPassword, salt);
        user.authProvider = 'local';
        user.providerId = undefined; 
        
        await user.save();

        resetTokenDoc.used = true;
        await resetTokenDoc.save();

        res.status(200).json({ message: 'הסיסמה אופסה בהצלחה.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
};

// A standalone login function, kept for compatibility with the router, though handleAuth is primary
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || user.authProvider !== 'local') {
            return res.status(401).json({ error: 'Invalid credentials or login method.' });
        }
        
        if (!user.is_verified) {
            return res.status(403).json({ 
                error: 'יש לאמת את כתובת המייל לפני שניתן להתחבר.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        const isMatch = await bcryptjs.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
