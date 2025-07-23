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
  // נזהה משתמש (בהנחה שיש req.user או req.session.user)
  let userId = null;
  if (req.user && req.user._id) {
    userId = req.user._id;
  }

  // אם אין משתמש – נייצר visitorId זמני (UUID)
  let visitorId = userId;
  if (!visitorId) {
    visitorId = uuidv4();
    // אפשרות עתידית: לשמור visitorId בקוקי
    // res.cookie('visitorId', visitorId, { httpOnly: true, sameSite: 'lax' });
    // אפשרות עתידית: לקבל visitorId מה־header
    // if (req.headers['x-visitor-id']) visitorId = req.headers['x-visitor-id'];
  }

  req.visitorId = visitorId;

  Sentry.setUser(userId ? { id: userId } : { id: visitorId, isGuest: true });

  logger.info({
    msg: 'Incoming request',
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: userId || undefined,
    visitorId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
  });

  next();
}

module.exports = loggingMiddleware; 