const rateLimit = require('express-rate-limit');

// General limiter for most API requests
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Stricter limiter for sensitive actions like login and password reset
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,//5, // Limit each IP to 5 login/reset attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login or password reset attempts from this IP, please try again after 15 minutes',
});

module.exports = {
    generalLimiter,
    authLimiter,
}; 