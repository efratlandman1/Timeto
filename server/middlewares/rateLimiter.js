const rateLimit = require('express-rate-limit');
const logger = require('../logger');
const { getRequestMeta } = require('../utils/errorUtils');
const Sentry = require('../sentry');

// Helper function to create rate limiters with logging
const createRateLimiter = (options, limiterName) => {
    return rateLimit({
        ...options,
        handler: (req, res) => {
            const logSource = `rateLimiter.${limiterName}`;
            const meta = getRequestMeta(req, logSource);
            
            logger.warn({ 
                ...meta,
                limiterName,
                windowMs: options.windowMs,
                maxRequests: options.max,
                msg: 'Rate limit exceeded'
            });
            
            Sentry.captureException(new Error(`Rate limit exceeded: ${limiterName} - IP: ${req.ip}`));
            
            res.status(429).json({
                error: 'Rate limit exceeded',
                message: options.message,
                retryAfter: Math.ceil(options.windowMs / 1000)
            });
        },
        skip: (req, res) => {
            // Skip rate limiting for certain conditions (optional)
            return false;
        }
    });
};

// General limiter - applied only to routes without specific limiters
const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 250, // Limit each IP to 250 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
}, 'generalLimiter');

// Auth limiter for sensitive authentication actions
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
}, 'authLimiter');

// Write limiter for all data modification operations (create, update, delete)
const writeLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40, // Limit each IP to 40 write operations per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many data modification attempts from this IP, please try again after 15 minutes',
}, 'writeLimiter');

module.exports = {
    generalLimiter,
    authLimiter,
    writeLimiter
}; 