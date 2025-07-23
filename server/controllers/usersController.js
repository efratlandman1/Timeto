const jwt = require('jsonwebtoken');
const User = require("../models/user");
const bcryptjs = require('bcryptjs');
const { successResponse, errorResponse, getRequestMeta } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require('@sentry/node');
const messages = require("../messages");

//register by auth
// exports.registerUser = async (req, res) => {
//    try {
//         const existingUser = await User.findOne({ email: req.body.email });
//         if (existingUser) {
//             // אם המשתמש קיים אבל לא מאומת, אפשר לשקול לשלוח שוב מייל אימות
//             // כרגע, נחזיר שגיאה פשוטה כדי למנוע דליפת מידע
//             return res.status(400).json({ error: 'Email already exists' });
//         }

//         const hashedPassword = await bcryptjs.hash(req.body.password, 10);
        
//         // 1. Generate verification token
//         const verificationToken = crypto.randomBytes(32).toString('hex');
        
//         // 2. Hash the token for database storage
//         const hashedToken = crypto
//             .createHash('sha256')
//             .update(verificationToken)
//             .digest('hex');

//         const newUser = new User({
//             firstName: req.body.firstName,
//             lastName: req.body.lastName,
//             email: req.body.email,
//             phone: req.body.phone,
//             nickname: req.body.nickname,
//             password: hashedPassword,
//             role: req.body.role || 'end-user',
//             verification_token: hashedToken // 3. Save the HASHED token
//         });

//         const savedUser = await newUser.save();
        
//         // 4. Send verification email with the ORIGINAL token
//         const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
//         const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
        
//         // Whitelist logic for development environment
//         const isDev = process.env.NODE_ENV === 'dev';
//         const emailWhitelist = process.env.EMAIL_WHITELIST ? process.env.EMAIL_WHITELIST.split(',') : [];
        
//         if (isDev && !emailWhitelist.includes(savedUser.email)) {
//             console.log(`Skipping verification email for ${savedUser.email} (not in whitelist for dev env).`);
//             // In dev, you might want to log the verification link to the console for easy testing
//             console.log(`Verification URL for ${savedUser.email}: ${verificationUrl}`);
//         } else {
//             try {
//                 await sendEmail({
//                     email: savedUser.email,
//                     subject: 'אימותת כתובת דוא"ל',
//                     html: emailTemplates.verifyEmail(verificationLink),
//                 });
//             } catch (err) {
//                 console.error('Email sending error during registration:', err);
//             }
//         }

//         // 5. Respond with a success message, NOT a token
//         res.status(201).json({ 
//             message: 'ההרשמה הצליחה! אנא בדוק את תיבת המייל שלך כדי לאמת את החשבון.' 
//         });

//     } catch (e) {
//         console.error(e);
//         res.status(500).json({ error: 'ההרשמה למערכת נכשלה' });
//     }
// };

exports.getAllUsers = async (req, res) => {
    const logSource = 'usersController.getAllUsers';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const users = await User.find({}).select('-password'); // Exclude passwords from the result
        logger.info({ ...meta, count: users.length }, `${logSource} complete`);
        
        return successResponse({
            res,
            req,
            data: { users },
            message: messages.USER_MESSAGES.GET_ALL_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.USER_MESSAGES.GET_ALL_ERROR,
            logSource
        });
    }
};

exports.updateUser = async (req, res) => {
    const logSource = 'usersController.updateUser';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta, currentUserId: req.user._id, targetUserId: req.params.id }, `${logSource} enter`);
    
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;
        
        // בדיקה אם המשתמש מעדכן את הפרופיל שלו או שהוא אדמין
        if (currentUserId.toString() !== targetUserId && req.user.role !== 'admin') {
            logger.warn({ ...meta, currentUserId, targetUserId }, messages.USER_MESSAGES.UNAUTHORIZED_UPDATE);
            return errorResponse({
                res,
                req,
                status: 403,
                message: messages.USER_MESSAGES.UNAUTHORIZED_UPDATE,
                logSource
            });
        }
        
        const updateData = { ...req.body };
        if (updateData.password && updateData.password.length > 0) {
            updateData.password = await bcryptjs.hash(updateData.password, 10);
        } else {
            // Ensure the password is not overwritten with an empty value
            delete updateData.password;
        }
        
        const updatedUser = await User.findByIdAndUpdate(targetUserId, updateData, { new: true }).select('-password');
       
        if (!updatedUser) {
            logger.warn({ ...meta, targetUserId }, messages.USER_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.USER_MESSAGES.NOT_FOUND,
                logSource
            });
        }

        const userData = {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role, 
            phonePrefix: updatedUser.phonePrefix,
            phone: updatedUser.phone,
            nickname: updatedUser.nickname
        };
        
        logger.info({ ...meta, currentUserId, targetUserId }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { user: userData },
            message: messages.USER_MESSAGES.UPDATE_SUCCESS,
            logSource
        });

    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.USER_MESSAGES.UPDATE_ERROR,
            logSource
        });
    }
};

exports.deleteUser = async (req, res) => {
    const logSource = 'usersController.deleteUser';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta, userId: req.params.id }, `${logSource} enter`);
    
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            logger.warn({ ...meta, userId: req.params.id }, messages.USER_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.USER_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        logger.info({ ...meta, userId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            message: messages.USER_MESSAGES.DELETE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.USER_MESSAGES.DELETE_ERROR,
            logSource
        });
    }
};
