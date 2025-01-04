const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY); // Verifies and decodes the JWT
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const extractUserId = (token) => {
    const decoded = verifyToken(token);
    return decoded.userId;  // Assuming the userId is stored in the JWT payload
};

module.exports = {
    verifyToken,
    extractUserId,
};
