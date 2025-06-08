const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub, given_name, family_name } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            user.authProvider = 'google';
            user.providerId = sub;
            user.password = undefined;
            // ניתן לעדכן את השם במקרה שרוצים
            user.firstName = given_name || user.firstName;
            user.lastName = family_name || user.lastName;
        } else {
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
