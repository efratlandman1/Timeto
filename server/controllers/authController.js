const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
require('dotenv').config();




exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: 'Email not found' });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // בונה את אובייקט המשתמש בלי הסיסמה
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            nickname: user.nickname,
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
