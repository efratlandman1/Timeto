const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/user');
const PasswordResetToken = require('../models/PasswordResetToken');
const sendEmail = require('../utils/SendEmail/sendEmail');
const { emailTemplates } = require('../utils/SendEmail/emailTemplates'); // אם אתה משתמש ב-export במקום module.exports
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const crypto = require('crypto');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Handles user login and registration with a single endpoint.
exports.handleAuth = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "נדרשים אימייל וסיסמה." });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים." });
    }

    try {
        let user = await User.findOne({ email });

        if (user) {
            // User exists
            if (user.is_verified) {
                // Case 1: User exists and is verified -> Standard login
                // if (user.authProvider !== 'local' || !user.password) {
                //     return res.status(409).json({ error: `This account is managed by ${user.authProvider}. Please log in using that method.` });
                // }

                const isMatch = await bcryptjs.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: 'סיסמה לא תקינה' });
                }

                // Login successful
                
                const token = jwt.sign({ firstName: user.firstName,lastName: user.lastName, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const userData = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                };
                return res.status(200).json({ token, user: userData, action: 'login' });

            } else {
                // Case 2: User exists but is not verified -> Overwrite password and resend verification
                // if (user.authProvider !== 'local') {
                //      return res.status(409).json({ error: `This account, linked with ${user.authProvider}, is not verified.` });
                // }
                
                const salt = await bcryptjs.genSalt(10);
                user.password = await bcryptjs.hash(password, salt);
                
                const verificationToken = crypto.randomBytes(32).toString('hex');
                user.verification_token = crypto.createHash('sha256').update(verificationToken).digest('hex');
                
                await user.save();

                const verificationUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
                console.log("User exists but is not verified" );
                await sendEmail({
                    email: user.email,
                    subject: 'אימות כתובת דוא"ל מחדש',
                    html: emailTemplates.resendVerification(verificationUrl),
                });
                
                return res.status(200).json({ status: 'verification-resent', message: 'הסיסמה שלך עודכנה. אנא בדוק את האימייל שלך כדי לאמת את חשבונך.' });
            }
        } else {
            // Case 3: User does not exist -> Create user, send verification
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(password, salt);
            
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

            const newUser = new User({
                email,
                password: hashedPassword,
                verification_token: hashedVerificationToken,
                is_verified: false,
                authProvider: 'local',
                firstName: '',
                lastName: '',
                phone: '',
                nickname: '',
                role: 'end-user'
            });
            console.log("newUser:",newUser);
            await newUser.save();

            console.log("User is not exists" );

            const verificationUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
            await sendEmail({
                email: newUser.email,
                subject: 'ברוכים הבאים ל-Time-To!',

                html: emailTemplates.verifyEmail(verificationUrl),
            });

            return res.status(201).json({ status: 'user-created', message: 'החשבון נוצר. אנא בדוק את האימייל שלך כדי לאמת את חשבונך.' });
        }
    } catch (err) {
        console.error('Auth handling error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
};

exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub, given_name, family_name, email_verified } = ticket.getPayload();

        if (!email_verified) {
            return res.status(400).json({ error: 'חשבון הגוגל אינו מאומת.' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // If user does not exist, create one. This flow assumes Google users are always welcome.
            user = new User({
                firstName: given_name || '',
                lastName: family_name || '',
                email: email,
                authProvider: 'google',
                providerId: sub,
                is_verified: true,
                phone: '',
                nickname: '',
                role: 'end-user'
            });
        } else {
             // If user exists, update their provider info and names from Google
            user.authProvider = 'google';
            user.providerId = sub;
            user.is_verified = true;
            if (given_name) user.firstName = given_name;
            if (family_name) user.lastName = family_name;
        }
        
        await user.save();
        const token = jwt.sign({ firstName: user.firstName,lastName: user.lastName, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };
        res.status(200).json({ token, user: userData });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({ error: 'אימות גוגל נכשל' });
    }
};

// לא קיבלתם את המייל? בדקו את תיבת הספאם או 
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.is_verified ) {
            return res.status(400).json({ message: 'לא ניתן לשלוח מחדש אימות למשתמש זה.' });
        }
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verification_token = crypto.createHash('sha256').update(verificationToken).digest('hex');
        await user.save();

        const verificationUrl = `${process.env.REACT_APP_API_DOMAIN || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'אימות כתובת דוא"ל מחדש',
            html: emailTemplates.resendVerification(verificationUrl),
        });

        res.status(200).json({ message: 'מייל אימות נשלח מחדש.' });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
};

// Verifies the email token and redirects user to a status page.
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';

        if (!token) {
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ verification_token: hashedToken });

        if (!user) {
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }
        
        user.is_verified = true;
        user.verification_token = undefined;
        await user.save();
        
        return res.redirect(`${clientUrl}/auth?verification_status=success`);
    } catch (error) {
        console.error('Email verification error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
        res.redirect(`${clientUrl}/auth?verification_status=failure`);
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

            const resetUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/reset-password?token=${resetToken}`; 
            await sendEmail({
                email: user.email,
                subject: 'בקשה לאיפוס סיסמה',
                html: emailTemplates.resetPassword(resetUrl),
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
            return res.status(400).json({ message: 'נדרשים token וסיסמה חדשה.' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 8 תווים.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetTokenDoc = await PasswordResetToken.findOne({ token: hashedToken });

        if (!resetTokenDoc || resetTokenDoc.used || resetTokenDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'ה-token שגוי או שפג תוקפו.' });
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

// This controller will handle the client-side landing after a password reset link is clicked.
// It redirects the user to the reset password page on the client with the token.
exports.handlePasswordResetRedirect = async (req, res) => {
    try {
        const { token } = req.query;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';

        if (!token) {
            // Redirect to the forgot-password page with an error
            return res.redirect(`${clientUrl}/forgot-password?error=invalid_token`);
        }
    
        // Redirect to the client-side reset password page
        res.redirect(`${clientUrl}/reset-password?token=${token}`);

    } catch (error) {
        console.error('Redirect to reset password error:', error);
        // Redirect to the forgot-password page with an error
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3030'}/forgot-password?error=server_error`);
    }
};
