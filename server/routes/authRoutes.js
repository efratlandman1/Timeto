const express = require('express');
const { registerUser, login,googleLogin} = require('../controllers/authController');

const router = express.Router();

// router.post('/register', registerUser);
router.post('/login', login);
router.post('/google', googleLogin); // <-- הוסף את השורה הזו

module.exports = router;
     