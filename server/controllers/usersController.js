const jwt = require('jsonwebtoken');
const User = require("../models/user");
 const bcryptjs = require('bcryptjs');
// const crypto = require('crypto');
// const sendEmail = require('../utils/SendEmail/sendEmail');
// const { emailTemplates } = require('../utils/Sendmail/emailTemplates'); // אם אתה משתמש ב-export במקום module.exports

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
    try {
        const users = await User.find({}).select('-password'); // Exclude passwords from the result
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

exports.updateUser = async (req, res) => {
    try {
        console.log("updateUser");
        const updateData = { ...req.body };
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
        // res.json(userData);
        res.status(200).json({ user:userData });

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
