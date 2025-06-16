const express = require('express');

const { googleLogin, requestPasswordReset, resetPassword, verifyEmail, handleAuth, resendVerificationEmail, handlePasswordResetRedirect } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();


// router.post('/register', registerUser);
router.post('/auth', authLimiter, handleAuth);
router.post('/google', authLimiter, googleLogin);
router.post('/request-password-reset', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/reset-password', handlePasswordResetRedirect);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationEmail);


module.exports = router;
     