const express = require('express');
const router = express.Router();
const { handleAuth, googleLogin, requestPasswordReset, resetPassword, verifyEmail } = require('../controllers/authController');
const { publicRoute } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateAuth } = require('../middlewares/inputValidation');

router.post('/auth', publicRoute, authLimiter, sanitizeRequest, validateAuth, handleAuth);
router.post('/google', publicRoute, authLimiter, sanitizeRequest, validateAuth, googleLogin);
router.post('/request-password-reset', publicRoute, authLimiter, sanitizeRequest, validateAuth, requestPasswordReset);
router.post('/reset-password', publicRoute, authLimiter, sanitizeRequest, validateAuth, resetPassword);

router.get('/verify-email', publicRoute, sanitizeRequest, verifyEmail);

module.exports = router;
     