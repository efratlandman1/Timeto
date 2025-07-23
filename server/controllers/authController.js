const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const PasswordResetToken = require('../models/PasswordResetToken');
const sendEmail = require('../utils/SendEmail/sendEmail');
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse, getRequestMeta } = require("../utils/errorUtils");
const logger = require("../logger");
const messages = require("../messages");
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
    const logSource = 'authController.handleAuth';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    const { email, password } = req.body;
    if (!email || !password) {
        logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_CREDENTIALS);
        return errorResponse({
            res,
            req,
            status: 400,
            message: messages.AUTH_MESSAGES.MISSING_CREDENTIALS,
            logSource
        });
    }
    if (password.length < 8) {
        logger.warn({ ...meta }, messages.AUTH_MESSAGES.INVALID_PASSWORD);
        return errorResponse({
            res,
            req,
            status: 400,
            message: messages.AUTH_MESSAGES.INVALID_PASSWORD,
            logSource
        });
    }

    try {
        let user = await User.findOne({ email });

        if (user) {
            // Case: User exists in the database.
            if (user.is_verified) {
                // Case 1: User exists and is verified -> Standard login attempt.
                if (!user.password) {
                    logger.warn({ ...meta, email }, messages.AUTH_MESSAGES.EMAIL_EXISTS);
                    return errorResponse({
                        res,
                        req,
                        status: 409,
                        message: messages.AUTH_MESSAGES.EMAIL_EXISTS,
                        logSource
                    });
                }
                const isMatch = await bcryptjs.compare(password, user.password);
                if (!isMatch) {
                    logger.warn({ ...meta, email }, messages.AUTH_MESSAGES.INVALID_CREDENTIALS);
                    return errorResponse({
                        res,
                        req,
                        status: 401,
                        message: messages.AUTH_MESSAGES.INVALID_CREDENTIALS,
                        logSource
                    });
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
                
                logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
                return successResponse({
                    res,
                    req,
                    status: 200,
                    data: { token, user: userData, action: 'login' },
                    message: messages.AUTH_MESSAGES.LOGIN_SUCCESS,
                    logSource
                });

            } else {
                // Case 2: User exists but is not verified -> Overwrite password and resend verification email.
                const salt = await bcryptjs.genSalt(10);
                user.password = await bcryptjs.hash(password, salt);
                
                const verificationToken = crypto.randomBytes(32).toString('hex');
                user.verification_token = crypto.createHash('sha256').update(verificationToken).digest('hex');
                
                await user.save();

                const verificationUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
                logger.info("Resending verification email for existing unverified user", { ...meta, email });
                
                await sendEmail({
                    email: user.email,
                    subject: 'אימות כתובת דוא"ל מחדש',
                    html: emailTemplates.resendVerification(verificationUrl),
                });
                
                logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
                return successResponse({
                    res,
                    req,
                    status: 200,
                    data: { status: 'verification-resent' },
                    message: messages.AUTH_MESSAGES.VERIFICATION_RESENT,
                    logSource
                });
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

            logger.info("New user created", { ...meta, userId: newUser._id });

            const verificationUrl = `${process.env.SERVER_URL || 'http://localhost:5050'}/api/v1/verify-email?token=${verificationToken}`;
            await sendEmail({
                email: newUser.email,
                subject: 'ברוכים הבאים ל-Time-To!',
                html: emailTemplates.verifyEmail(verificationUrl),
            });

            logger.info({ ...meta, userId: newUser._id }, `${logSource} complete`);
            return successResponse({
                res,
                req,
                status: 201,
                data: { status: 'user-created' },
                message: messages.AUTH_MESSAGES.USER_CREATED,
                logSource
            });
        }
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: messages.AUTH_MESSAGES.SERVER_ERROR,
            logSource
        });
    }
};

/**
 * Handles user login via Google.
 * This function is called when a user authenticates with Google on the client-side.
 * It verifies the Google ID token, and then either creates a new user or logs in an existing user.
 */
exports.googleLogin = async (req, res) => {
    const logSource = 'authController.googleLogin';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    const { tokenId } = req.body;
    
    if (!tokenId) {
        logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_CREDENTIALS);
        return errorResponse({
            res,
            req,
            status: 400,
            message: messages.AUTH_MESSAGES.MISSING_CREDENTIALS,
            logSource
        });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        if (!payload.email_verified) {
            logger.warn({ ...meta, email: payload.email }, messages.AUTH_MESSAGES.GOOGLE_NOT_VERIFIED);
            return errorResponse({
                res,
                req,
                status: 403,
                message: messages.AUTH_MESSAGES.GOOGLE_NOT_VERIFIED,
                logSource
            });
        }

        let user = await User.findOne({ email: payload.email });
        
        if (!user) {
            // Create new user from Google data
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
        
        logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            status: 200,
            data: { token, user: userData },
            message: messages.AUTH_MESSAGES.LOGIN_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: messages.AUTH_MESSAGES.GOOGLE_AUTH_FAILED,
            logSource
        });
    }
};

/**
 * Resends the verification email to a user who has not yet verified their account.
 * This is called if the user requests to send the email again from the client-side.
 */
exports.resendVerificationEmail = async (req, res) => {
    const logSource = 'authController.resendVerificationEmail';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { email } = req.body;
        if (!email) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_EMAIL);
            return errorResponse({
                res,
                req,
                status: 400,
                message: messages.AUTH_MESSAGES.MISSING_EMAIL,
                logSource
            });
        }
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn({ ...meta, email }, messages.AUTH_MESSAGES.USER_NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.AUTH_MESSAGES.USER_NOT_FOUND,
                logSource
            });
        }
        
        if (user.is_verified) {
            logger.warn({ ...meta, email }, messages.AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
            return errorResponse({
                res,
                req,
                status: 409,
                message: messages.AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
                logSource
            });
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

        logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            status: 200,
            message: "מייל אימות נשלח מחדש. אנא בדוק את תיבת הדואר הנכנס וגם את תיבת הספאם",
            logSource
        });

    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: messages.AUTH_MESSAGES.SERVER_ERROR,
            logSource
        });
    }
};

/**
 * Verifies an email address based on a token from a verification link.
 * This endpoint is called when a user clicks the verification link in their email.
 * It finds the user by the hashed token, marks them as verified, and redirects to the client.
 */
exports.verifyEmail = async (req, res) => {
    const logSource = 'authController.verifyEmail';
    const meta = getRequestMeta(req, logSource);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { token } = req.query;

        if (!token) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_TOKEN);
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ verification_token: hashedToken });

        if (!user) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.INVALID_TOKEN);
            return res.redirect(`${clientUrl}/auth?verification_status=failure`);
        }
        
        user.is_verified = true;
        user.verification_token = undefined; // Invalidate the token after use.
        await user.save();
        
        logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
        // Redirect to a success page on the client.
        return res.redirect(`${clientUrl}/auth?verification_status=success`);
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
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
    const logSource = 'authController.requestPasswordReset';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { email } = req.body;
        if (!email) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_EMAIL);
            return errorResponse({
                res,
                req,
                status: 400,
                message: messages.AUTH_MESSAGES.MISSING_EMAIL,
                logSource
            });
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
            
            logger.info("Password reset email sent", { ...meta, logSource, email });
        }
        
        // Always return a success-like message to prevent email enumeration attacks.
        logger.info({ ...meta }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            status: 200,
            message: messages.AUTH_MESSAGES.PASSWORD_RESET_SENT,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: messages.AUTH_MESSAGES.SERVER_ERROR,
            logSource
        });
    }
};

/**
 * Resets the user's password using a valid token.
 * This is called when the user submits the new password on the client-side reset page.
 * It validates the token, checks its expiration, and updates the user's password.
 */
exports.resetPassword = async (req, res) => {
    const logSource = 'authController.resetPassword';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_TOKEN_OR_PASSWORD);
            return errorResponse({
                res,
                req,
                status: 400,
                message: messages.AUTH_MESSAGES.MISSING_TOKEN_OR_PASSWORD,
                logSource
            });
        }
        
        if (newPassword.length < 8) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.INVALID_PASSWORD);
            return errorResponse({
                res,
                req,
                status: 400,
                message: messages.AUTH_MESSAGES.INVALID_PASSWORD,
                logSource
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetTokenDoc = await PasswordResetToken.findOne({ token: hashedToken });

        if (!resetTokenDoc || resetTokenDoc.used || resetTokenDoc.expiresAt < new Date()) {
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.INVALID_TOKEN);
            return errorResponse({
                res,
                req,
                status: 400,
                message: messages.AUTH_MESSAGES.INVALID_TOKEN,
                logSource
            });
        }

        const user = await User.findOne({ email: resetTokenDoc.email });
        if (!user) {
            // This case should be rare if the token is valid, but handle it for safety.
            logger.warn({ ...meta, email: resetTokenDoc.email }, messages.AUTH_MESSAGES.USER_NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.AUTH_MESSAGES.USER_NOT_FOUND,
                logSource
            });
        }

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(newPassword, salt);
        user.authProvider = 'local'; // Ensure auth method is set to local.
        user.providerId = undefined; // Clear any social provider ID.
        
        await user.save();

        resetTokenDoc.used = true; // Mark the token as used to prevent reuse.
        await resetTokenDoc.save();

        logger.info({ ...meta, userId: user._id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            status: 200,
            message: messages.AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: messages.AUTH_MESSAGES.SERVER_ERROR,
            logSource
        });
    }
};

/**
 * Handles the redirect from the password reset email link.
 * This endpoint is hit when the user clicks the link in their email. Its sole purpose
 * is to redirect the user to the correct page on the client-side application,
 * passing the token along as a URL query parameter.
 */
exports.handlePasswordResetRedirect = async (req, res) => {
    const logSource = 'authController.handlePasswordResetRedirect';
    const meta = getRequestMeta(req, logSource);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { token } = req.query;

        if (!token) {
            // If no token is provided, redirect to forgot-password page with an error.
            logger.warn({ ...meta }, messages.AUTH_MESSAGES.MISSING_TOKEN);
            return res.redirect(`${clientUrl}/forgot-password?error=invalid_token`);
        }
    
        // Redirect to the client-side reset password page with the token.
        res.redirect(`${clientUrl}/reset-password?token=${token}`);

    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        // On any server error, redirect to forgot-password with a generic error.
        res.redirect(`${clientUrl}/forgot-password?error=server_error`);
    }
};
