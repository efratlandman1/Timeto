const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const Sentry = require('../sentry');

/**
 * Middleware גלובלי:
 * - מזהה משתמש או אורח
 * - יוצר visitorId זמני לאורח
 * - מוסיף את המזהה ללוגים ול־Sentry
 */
function loggingMiddleware(req, res, next) {
  // Always generate a unique requestId for every request
  req.requestId = uuidv4();
  // נזהה משתמש אם קיים (אחרת לא ניצור visitorId)
  const userId = req.user && req.user._id ? req.user._id : null;
  const userEmail = req.user && req.user.email ? req.user.email : undefined;

  if (userId) {
    Sentry.setUser({ id: userId, email: userEmail });
  } else {
    Sentry.setUser(null);
  }

  logger.info({
    msg: 'Incoming request',
    requestId: req.requestId,
    method: req.method,
    url: `${process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`}${req.originalUrl}`,
    userId: userId || undefined,
    userEmail,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
  });

  next();
}

module.exports = loggingMiddleware; 