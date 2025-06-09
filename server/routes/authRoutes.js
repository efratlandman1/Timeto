const express = require('express');
const { registerUser, login, googleLogin, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// router.post('/register', registerUser);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/request-password-reset', authLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
     