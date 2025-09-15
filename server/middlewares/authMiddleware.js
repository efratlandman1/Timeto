require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { verifyToken } = require('../utils/authUtils');
const logger = require('../logger');
const { getRequestMeta } = require('../utils/errorUtils');
const Sentry = require('../sentry');

/**
 * פונקציה פנימית לאימות - לא מחזירה שגיאה אם אין טוקן
 */
const _authenticateUser = async (req) => {
    const token = req.header('Authorization')?.split(' ')[1];
    const logSource = 'authMiddleware._authenticateUser';
    const meta = getRequestMeta(req, logSource);
  
    if (!token) {
      logger.info({ 
        ...meta,
        msg: 'No token provided in request'
      });
      // החזרה עדינה – אין טוקן
      return { user: null, error: 'NO_TOKEN' };
    }
  
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
  
      if (!user) {
        logger.warn({ 
          ...meta,
          decodedUserId: decoded.userId,
          msg: 'User not found for valid token'
        });
        Sentry.captureException(new Error(`User not found for valid token: ${decoded.userId}`));
        return { user: null, error: 'USER_NOT_FOUND' };
      }
  
      if (!user.is_verified) {
        logger.warn({ 
          ...meta,
          userId: user._id,
          userEmail: user.email,
          msg: 'Unverified user attempted access'
        });
        Sentry.captureException(new Error(`Unverified user attempted access: ${user._id}`));
        return { user: null, error: 'EMAIL_NOT_VERIFIED' };
      }
  
      logger.info({ 
        ...meta,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        msg: 'User authenticated successfully'
      });
      return { user, error: null };
    } catch (err) {
      logger.error({ 
        ...meta,
        error: err.message,
        stack: err.stack,
        msg: 'JWT verification failed'
      });
      Sentry.captureException(err);
      return { user: null, error: 'INVALID_TOKEN' };
    }
  };
  

/**
 * מידלוור לאימות משתמש רגיל - דורש טוקן תקין ומשתמש מאומת
 */
const requireAuth = async (req, res, next) => {
    const logSource = 'authMiddleware.requireAuth';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ 
      ...meta,
      msg: 'Authentication required for endpoint'
    });

    const { user, error } = await _authenticateUser(req);
  
    if (!user) {
      logger.warn({ 
        ...meta,
        authError: error,
        msg: 'Authentication failed'
      });
      
      Sentry.captureException(new Error(`Authentication failed: ${error}`));
      
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
    const logSource = 'authMiddleware.requireAdmin';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ 
      ...meta,
      msg: 'Admin authentication required for endpoint'
    });

    const { user, error } = await _authenticateUser(req);
  
    if (!user) {
      logger.warn({ 
        ...meta,
        authError: error,
        msg: 'Admin authentication failed - no user'
      });
      Sentry.captureException(new Error(`Admin authentication failed - no user: ${error}`));
      return res.status(401).json({ message: 'Access denied.' }); // או לוגיקה מורחבת כמו ב־requireAuth
    }
  
    if (user.role !== 'admin') {
      logger.warn({ 
        ...meta,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        msg: 'Non-admin user attempted admin access'
      });
      Sentry.captureException(new Error(`Non-admin user attempted admin access: ${user._id} (role: ${user.role})`));
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  
    logger.info({ 
      ...meta,
      userId: user._id,
      userEmail: user.email,
      msg: 'Admin access granted'
    });
    
    req.user = user;
    next();
  };
  



/**
 * מידלוור לאימות אופציונלי - מאפשר גישה עם או בלי טוקן
 */
const optionalAuth = async (req, res, next) => {
  const logSource = 'authMiddleware.optionalAuth';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ 
    ...meta,
    msg: 'Optional authentication for endpoint'
  });

  const { user }  = await _authenticateUser(req);
  
  if (user) {
    logger.info({ 
      ...meta,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      msg: 'Optional authentication successful'
    });
  } else {
    logger.info({ 
      ...meta,
      msg: 'Optional authentication - no user (guest access)'
    });
  }
  
  req.user = user; // null אם אין משתמש תקין
  next();
};

/**
 * מידלוור לראוטים ציבוריים - לא דורש אימות
 */
const publicRoute = (req, res, next) => {
    const logSource = 'authMiddleware.publicRoute';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ 
      ...meta,
      msg: 'Public route accessed'
    });
    
    // תמיד ממשיכים ללא אימות
    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    optionalAuth,
    publicRoute
};
