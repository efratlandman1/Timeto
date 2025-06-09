const express = require('express');
const { registerUser, login, googleLogin, requestPasswordReset, resetPassword } = require('../controllers/authController');

const router = express.Router();

// router.post('/register', registerUser);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
     