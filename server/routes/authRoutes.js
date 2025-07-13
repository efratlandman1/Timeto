const express = require('express');
const { googleLogin, requestPasswordReset, resetPassword, verifyEmail, handleAuth } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const { publicRoute } = require('../middlewares/authMiddleware');

const router = express.Router();

// router.post('/register', registerUser);
router.post('/auth', publicRoute, authLimiter, handleAuth);
router.post('/google', publicRoute, authLimiter, googleLogin);
router.post('/request-password-reset', publicRoute, authLimiter, requestPasswordReset);
router.post('/reset-password', publicRoute, authLimiter, resetPassword);
router.get('/verify-email', publicRoute, verifyEmail);

module.exports = router;
     