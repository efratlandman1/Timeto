require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * פונקציה פנימית לאימות - לא מחזירה שגיאה אם אין טוקן
 */
const _authenticateUser = async (req) => {
    const token = req.header('Authorization')?.split(' ')[1];
  
    if (!token) {
      // החזרה עדינה – אין טוקן
      return { user: null, error: 'NO_TOKEN' };
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
  
      if (!user) {
        return { user: null, error: 'USER_NOT_FOUND' };
      }
  
      if (!user.is_verified) {
        return { user: null, error: 'EMAIL_NOT_VERIFIED' };
      }
  
      return { user, error: null };
    } catch (err) {
      console.error('JWT Error:', err); // לוג מלא פנימי
      return { user: null, error: 'INVALID_TOKEN' };
    }
  };
  

/**
 * מידלוור לאימות משתמש רגיל - דורש טוקן תקין ומשתמש מאומת
 */
const requireAuth = async (req, res, next) => {
    const { user, error } = await _authenticateUser(req);
  
    if (!user) {
      switch (error) {
        case 'NO_TOKEN':
          return res.status(401).json({ message: 'Access denied. Token missing.' });
        case 'INVALID_TOKEN':
          return res.status(403).json({ message: 'Access denied. Invalid or expired token.' });
        case 'USER_NOT_FOUND':
          return res.status(401).json({ message: 'Access denied. User not found.' });
        case 'EMAIL_NOT_VERIFIED':
          return res.status(403).json({ message: 'Access denied. Please verify your email.' });
        default:
          return res.status(401).json({ message: 'Access denied.' });
      }
    }
  
    req.user = user;
    next();
  };
  

/**
 * מידלוור לאימות אדמין - דורש משתמש מאומת עם הרשאות אדמין
 */
const requireAdmin = async (req, res, next) => {
    const { user, error } = await _authenticateUser(req);
  
    if (!user) {
      return res.status(401).json({ message: 'Access denied.' }); // או לוגיקה מורחבת כמו ב־requireAuth
    }
  
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  
    req.user = user;
    next();
  };
  


/**
 * מידלוור לאימות אופציונלי - מאפשר גישה עם או בלי טוקן
 */
const optionalAuth = async (req, res, next) => {
  const { user }  = await _authenticateUser(req);
    req.user = user; // null אם אין משתמש תקין
    next();
};

/**
 * מידלוור לראוטים ציבוריים - לא דורש אימות
 */
const publicRoute = (req, res, next) => {
    // תמיד ממשיכים ללא אימות
    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    optionalAuth,
    publicRoute
};
