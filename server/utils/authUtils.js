const jwt = require('jsonwebtoken');
const logger = require('../logger');
const Sentry = require('../sentry');
const SECRET_KEY = process.env.JWT_SECRET;

// JWT configuration for security
const JWT_CONFIG = {
  algorithm: 'HS256',
  issuer: 'time-to-app',
  audience: 'time-to-users',
  expiresIn: process.env.JWT_EXPIRES_IN || '30d'
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY, {
          algorithms: [JWT_CONFIG.algorithm],
          issuer: JWT_CONFIG.issuer,
          audience: JWT_CONFIG.audience
        });
        
        logger.info({ 
            msg: 'JWT token verified successfully',
            userId: decoded.userId,
            logSource: 'authUtils.verifyToken'
        });
        
        return decoded;
    } catch (error) {
        logger.error({ 
            msg: 'JWT verification failed',
            error: error.message,
            stack: error.stack,
            logSource: 'authUtils.verifyToken'
        });
        Sentry.captureException(error);
        throw new Error('Invalid token');
    }
};

const generateToken = (payload) => {
    try {
        const token = jwt.sign(payload, SECRET_KEY, JWT_CONFIG);
        
        logger.info({ 
            msg: 'JWT token generated successfully',
            userId: payload.userId,
            logSource: 'authUtils.generateToken'
        });
        
        return token;
    } catch (error) {
        logger.error({ 
            msg: 'JWT token generation failed',
            error: error.message,
            stack: error.stack,
            userId: payload.userId,
            logSource: 'authUtils.generateToken'
        });
        Sentry.captureException(error);
        throw error;
    }
};

const extractUserId = (token) => {
    try {
        const decoded = verifyToken(token);
        logger.info({ 
            msg: 'User ID extracted from token',
            userId: decoded.userId,
            logSource: 'authUtils.extractUserId'
        });
        return decoded.userId;
    } catch (error) {
        logger.error({ 
            msg: 'Failed to extract user ID from token',
            error: error.message,
            logSource: 'authUtils.extractUserId'
        });
        Sentry.captureException(error);
        throw error;
    }
};

module.exports = {
    verifyToken,
    generateToken,
    extractUserId,
};
