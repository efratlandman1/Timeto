const rateLimit = require('express-rate-limit');

// General limiter - applied only to routes without specific limiters
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 250, // Limit each IP to 250 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Auth limiter for sensitive authentication actions
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});

// Write limiter for all data modification operations (create, update, delete)
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40, // Limit each IP to 40 write operations per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many data modification attempts from this IP, please try again after 15 minutes',
});

module.exports = {
    generalLimiter,
    authLimiter,
    writeLimiter
}; 