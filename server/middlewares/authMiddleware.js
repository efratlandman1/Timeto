require('dotenv').config();
const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
    const openRoutes = [
        '/api/v1/login',
        '/api/v1/register',
        '/api/v1/businesses',
    ];

    if (openRoutes.includes(req.path)) {
        return next(); // Allow access to open routes
    }

    const token = req.header('Authorization')?.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = jwtAuthMiddleware;
