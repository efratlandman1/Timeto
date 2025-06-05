const adminAuth = (req, res, next) => {
    // This middleware should run AFTER the standard jwtAuthMiddleware,
    // so the req.user object will be available.
    console.log("req.user",req.user);
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Admin privileges required.' });
    }
};

module.exports = adminAuth; 