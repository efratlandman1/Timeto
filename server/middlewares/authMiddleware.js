require('dotenv').config();
const jwt = require('jsonwebtoken');


// פונקציה לבדיקת התאמה של מסלול עם פרמטרים דינמיים
const matchPath = (path, routePattern) => {
  const routeRegex = new RegExp('^' + routePattern.replace(/:[^\/]+/g, '[^/]+') + '$');
  return routeRegex.test(path);
};

const jwtAuthMiddleware = (req, res, next) => {
    const openRoutes = [
        '/api/v1/login',
        '/api/v1/register',
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
    const isOpen = openRoutes.some((route) => matchPath(req.path, route));
    if (isOpen) {
        return next(); // פתוח – לא צריך טוקן
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
