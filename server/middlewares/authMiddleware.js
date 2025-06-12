require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user');


// פונקציה לבדיקת התאמה של מסלול עם פרמטרים דינמיים
const matchPath = (path, routePattern) => {
  const routeRegex = new RegExp('^' + routePattern.replace(/:[^\/]+/g, '[^/]+') + '$');
  return routeRegex.test(path);
};

const jwtAuthMiddleware = async (req, res, next) => {
    const openRoutes = [
        '/api/v1/login',
        '/api/v1/google',
        '/api/v1/request-password-reset',
        '/api/v1/reset-password',
        '/api/v1/auth',
        '/api/v1/set-password',
        // '/api/v1/users/register',
        '/api/v1/verify-email',
        '/api/v1/businesses',
        '/api/v1/categories',
        '/api/v1/services',
        '/api/v1/businesses/:id',
        '/api/v1/services/byCategory/:categoryId',
        '/api/v1/feedbacks/business/:businessId',
        '/api/v1/suggestions', //check how to limit to post only
        '/api/v1/stats/home'
    ];

    // if (openRoutes.includes(req.path) 
    // ) {  //delete!!!!!!!!!!!!!!
    //     return next(); // Allow access to open routes
    // }
    console.log("req.path",req.path);
    const isOpen = openRoutes.some((route) => matchPath(req.path, route));
    console.log("isOpen",isOpen);
    if (isOpen) {
        return next(); // פתוח – לא צריך טוקן
    }
    


    const token = req.header('Authorization')?.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded",decoded);
        console.log("decoded.userId",decoded.userId);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Authorization failed, user not found.' });
        }
        
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email to access this resource.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = jwtAuthMiddleware;
