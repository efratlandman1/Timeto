const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

// JWT configuration for security
const JWT_CONFIG = {
  algorithm: 'HS256',
  issuer: 'time-to-app',
  audience: 'time-to-users',
  expiresIn: '1h'
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY, {
          algorithms: [JWT_CONFIG.algorithm],
          issuer: JWT_CONFIG.issuer,
          audience: JWT_CONFIG.audience
        });
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const generateToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, JWT_CONFIG);
};

const extractUserId = (token) => {
    const decoded = verifyToken(token);
    console.log(decoded);
    return decoded.userId;
};

module.exports = {
    verifyToken,
    generateToken,
    extractUserId,
};
