const express = require('express');
const { registerUser, login, googleLogin, requestPasswordReset, resetPassword, verifyEmail, handleAuth, setPasswordAfterVerification } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// router.post('/register', registerUser);
router.post('/auth', authLimiter, handleAuth);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/request-password-reset', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/set-password', authLimiter, setPasswordAfterVerification);
router.get('/verify-email', verifyEmail);

module.exports = router;
     