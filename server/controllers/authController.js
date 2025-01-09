const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {saveUser} = require("./usersController");
require('dotenv').config();

exports.registerUser = async (req, res) => {
    const existingUser = await User.findOne({ name: req.body.username });
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
        name: req.body.username,
        password: hashedPassword
    });

    try {
        let saveUser = newUser.save();
        console.log(saveUser)
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

exports.login = async (req, res) => {
    const user = await User.findOne({ name: req.body.username });
    if (!user) {
        return res.status(400).json({ error: 'User name is not found' });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Wrong password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
};
