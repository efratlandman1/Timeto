const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
require('dotenv').config();

exports.registerUser = async (req, res) => {
    // בדוק אם המשתמש כבר קיים לפי אימייל (כיוון שהאימייל הוא ייחודי)
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // יצירת משתמש חדש
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        nickname: req.body.nickname,
        password: hashedPassword
    });

    try {
        // שמירה של המשתמש
        const savedUser = await newUser.save();
        
        // יצירת JWT עם מזהה המשתמש
        const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // החזרת הטוקן ב-JSON
        res.status(201).json({ token });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

exports.login = async (req, res) => {
    // חיפוש משתמש לפי אימייל
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({ error: 'Email not found' });
    }

    // השוואת סיסמה
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect password' });
    }

    // יצירת JWT עם מזהה המשתמש
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // החזרת הטוקן ב-JSON
    res.status(201).json({ token });
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
