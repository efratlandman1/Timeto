const jwt = require('jsonwebtoken');
const User = require("../models/user");
const bcrypt = require('bcrypt');

exports.registerUser = async (req, res) => {
   console.log("registerUser");
    try {
        // בדיקה אם קיים משתמש עם אותו אימייל
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // הצפנת הסיסמה
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // יצירת המשתמש
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            nickname: req.body.nickname,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // יצירת JWT
        const token = jwt.sign({ userId: savedUser._id, email: savedUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // שליחת טוקן + מידע על המשתמש (בלי הסיסמה)
        const { password, ...userData } = savedUser.toObject();
        res.status(201).json({ token, user: userData });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

exports.saveUser = async (req, res) => {
    const newUser = new User({
        "name": req.body.username,
        "password": req.body.password
    });

    try {
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, 'your_jwt_secret_key', { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

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
        // In a real app, you would add logic to hash the password if it's being changed
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
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
