const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const PasswordResetToken = require('../models/PasswordResetToken');
const sendEmail = require('../utils/SendEmail/sendEmail');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const emailTemplates = require('../utils/SendEmail/emailTemplates');
const { generateToken } = require('../utils/authUtils');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * Handles user login and registration with a single endpoint.
 * This function is called when a user tries to log in or register using an email and password.
 * It manages three main scenarios:
 * 1. Existing and verified user: Standard login.
 * 2. Existing but unverified user: Updates password and resends verification email.
 * 3. New user: Creates the user, and sends a verification email.
 */
exports.handleAuth = async (req, res) => {
    console.log('Entering handleAuth function');
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
            // Case: User exists in the database.
            if (user.is_verified) {
                // Case 1: User exists and is verified -> Standard login attempt.
                if (!user.password) {
                    // This can happen if the user signed up via a social provider (like Google) first.
                    return res.status(409).json({ error: 'כבר יש חשבון עם כתובת האימייל הזו, אך לא הוגדרה לו סיסמה. תוכל להמשיך על ידי הגדרת סיסמה חדשה' });
                }
                const isMatch = await bcryptjs.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: 'סיסמה לא תקינה. אנא נסה שוב.' });
                }

                // Login successful
                
            const token = generateToken({ userId: user._id, email: user.email, role: user.role ,firstName: user.firstName,lastName: user.lastName});

                const userData = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    phonePrefix: user.phonePrefix,
                    phone: user.phone,
                    nickname:user.nickname
                    
                };
                return res.status(200).json({ token, user: userData, action: 'login' });

            } else {
                // Case 2: User exists but is not verified -> Overwrite password and resend verification email.
                // This allows the user to "re-register" if they never verified their email.
                const salt = await bcryptjs.genSalt(10);
                user.password = await bcryptjs.hash(password, salt);
                
                const verificationToken = crypto.randomBytes(32).toString('hex');
                user.verification_token = crypto.createHash('sha256').update(verificationToken).digest('hex');
                
                await user.save();

                const verificationUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
                console.log("משתמש קיים אך לא אומת, נשלח אימות מחדש לכתובת האימייל" );
                await sendEmail({
                    email: user.email,
                    subject: 'אימות כתובת דוא"ל מחדש',
                    html: emailTemplates.resendVerification(verificationUrl),
                });
                
                return res.status(200).json({ status: 'verification-resent', message: 'הסיסמה שלך עודכנה. אנא בדוק את האימייל שלך כדי לאמת את חשבונך.' });
            }
        } else {
            // Case 3: User does not exist -> Create a new user and send a verification email.
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
            await newUser.save();

            console.log("New user created. Sending verification email." );

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
        res.status(500).json({ error: 'אירעה שגיאת שרת פנימית. אנא נסה שוב מאוחר יותר.' });
    }
};

/**
 * Handles user login via Google.
 * This function is called when a user authenticates with Google on the client-side.
 * It verifies the Google ID token, and then either creates a new user or logs in an existing user.
 */
exports.googleLogin = async (req, res) => {
    console.log('Entering googleLogin function');
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub, given_name, family_name, email_verified } = ticket.getPayload();

        if (!email_verified) {
            return res.status(403).json({ error: 'חשבון הגוגל אינו מאומת. לא ניתן להמשיך.' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // If user does not exist, create a new one based on Google's data.
            user = new User({
                firstName: given_name || '',
                lastName: family_name || '',
                email: email,
                authProvider: 'google',
                providerId: sub,
                is_verified: true, // Google accounts are considered pre-verified.
                phone: '',
                nickname: '',
                role: 'end-user',
                password: undefined // No local password for Google-auth users.
            });
        } else {
             // If user exists, update their provider info to 'google' and sync names.
            user.authProvider = 'google';
            user.providerId = sub;
            user.is_verified = true;
            if (given_name) user.firstName = given_name;
            if (family_name) user.lastName = family_name;
            user.password =  undefined // Clear any existing local password.
        }
        
        await user.save();
        const token = generateToken({ userId: user._id, 
                                 email: user.email, 
                                 role: user.role ,
                                 firstName: user.firstName,
                                 lastName: user.lastName});

        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phonePrefix: user.phonePrefix,
            phone: user.phone,
            nickname:user.nickname
        };
        res.status(200).json({ token, user: userData });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({ error: 'אימות גוגל נכשל עקב שגיאת שרת.' });
    }
};

/**
 * Resends the verification email to a user who has not yet verified their account.
 * This is called if the user requests to send the email again from the client-side.
 */
exports.resendVerificationEmail = async (req, res) => {
    console.log('Entering resendVerificationEmail function');
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'כתובת אימייל נדרשת.' });
        }
        const user = await User.findOne({ email });

        if (!user) {
             return res.status(404).json({ message: 'לא נמצא משתמש עם כתובת אימייל זו.' });
        }
        
        if (user.is_verified) {
            return res.status(409).json({ message: 'חשבון זה כבר מאומת.' });
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

        res.status(200).json({ message: 'מייל אימות נשלח מחדש. אנא בדוק את תיבת הדואר הנכנס וגם את תיבת הספאם.' });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ message: 'אירעה שגיאת שרת. נסה שוב מאוחר יותר.' });
    }
};

/**
 * Verifies an email address based on a token from a verification link.
 * This endpoint is called when a user clicks the verification link in their email.
 * It finds the user by the hashed token, marks them as verified, and redirects to the client.
 */
exports.verifyEmail = async (req, res) => {
    console.log('Entering verifyEmail function');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ verification_token: hashedToken });

        if (!user) {
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }
        
        user.is_verified = true;
        user.verification_token = undefined; // Invalidate the token after use.
        await user.save();
        
        // Redirect to a success page on the client.
        return res.redirect(`${clientUrl}/auth?verification_status=success`);
    } catch (error) {
        console.error('Email verification error:', error);
        // Redirect on any server error.
        res.redirect(`${clientUrl}/auth?verification_status=failure&reason=server_error`);
    }
};

/**
 * Sends a password reset link to the user's email.
 * This is called from the "Forgot Password" page.
 * It generates a secure, single-use token and emails a link containing it.
 */
exports.requestPasswordReset = async (req, res) => {
    console.log('Entering requestPasswordReset function');
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'כתובת אימייל נדרשת.' });
        }
        const user = await User.findOne({ email });

        if (user) {
            // Only proceed if a user exists to avoid confirming which emails are registered.
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const expiresAt = new Date(Date.now() + 3600000); // Token is valid for 1 hour.

            await PasswordResetToken.findOneAndUpdate(
                { email },
                { token: hashedToken, expiresAt, used: false },
                { new: true, upsert: true } // Create a new token doc if one doesn't exist.
            );

            const resetUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/reset-password?token=${resetToken}`; 
            await sendEmail({
                email: user.email,
                subject: 'בקשה לאיפוס סיסמה',
                html: emailTemplates.resetPassword(resetUrl),
            });
        }
        
        // Always return a success-like message to prevent email enumeration attacks.
        res.status(200).json({ message: 'אם קיים משתמש עם כתובת אימייל זו, נשלח אליו קישור לאיפוס סיסמה.' });
    } catch (error) {
        console.error('Request password reset error:', error);
        res.status(500).json({ message: 'אירעה שגיאת שרת. נסה שוב מאוחר יותר.' });
    }
};

/**
 * Resets the user's password using a valid token.
 * This is called when the user submits the new password on the client-side reset page.
 * It validates the token, checks its expiration, and updates the user's password.
 */
exports.resetPassword = async (req, res) => {
    console.log('Entering resetPassword function');
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'נדרשים টোকেন וסיסמה חדשה.' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 8 תווים.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetTokenDoc = await PasswordResetToken.findOne({ token: hashedToken });

        if (!resetTokenDoc || resetTokenDoc.used || resetTokenDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'ה-token שגוי, פג תוקפו או שכבר נעשה בו שימוש.' });
        }

        const user = await User.findOne({ email: resetTokenDoc.email });
        if (!user) {
            // This case should be rare if the token is valid, but handle it for safety.
            return res.status(404).json({ message: 'לא נמצא משתמש המשויך ל-token זה.' });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(newPassword, salt);
        user.authProvider = 'local'; // Ensure auth method is set to local.
        user.providerId = undefined; // Clear any social provider ID.
        
        await user.save();

        resetTokenDoc.used = true; // Mark the token as used to prevent reuse.
        await resetTokenDoc.save();

        res.status(200).json({ message: 'הסיסמה אופסה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'אירעה שגיאת שרת. נסה שוב מאוחר יותר.' });
    }
};

/**
 * Handles the redirect from the password reset email link.
 * This endpoint is hit when the user clicks the link in their email. Its sole purpose
 * is to redirect the user to the correct page on the client-side application,
 * passing the token along as a URL query parameter.
 */
exports.handlePasswordResetRedirect = async (req, res) => {
    console.log('Entering handlePasswordResetRedirect function');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
    try {
        const { token } = req.query;

        if (!token) {
            // If no token is provided, redirect to forgot-password page with an error.
            return res.redirect(`${clientUrl}/forgot-password?error=invalid_token`);
        }
    
        // Redirect to the client-side reset password page with the token.
        res.redirect(`${clientUrl}/reset-password?token=${token}`);

    } catch (error) {
        console.error('Redirect to reset password error:', error);
        // On any server error, redirect to forgot-password with a generic error.
        res.redirect(`${clientUrl}/forgot-password?error=server_error`);
    }
};
