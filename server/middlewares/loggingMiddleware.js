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

  // נצרף את המזהה לאובייקט הבקשה
  req.visitorId = visitorId;

  // נעדכן את Sentry עם מזהה המשתמש/אורח
  Sentry.setUser(userId ? { id: userId } : { id: visitorId, isGuest: true });

  // נוסיף לוג structured לכל בקשה (אפשר להרחיב לפי הצורך)
  logger.info({
    msg: 'Incoming request',
    method: req.method,
    url: req.originalUrl,
    userId: userId || undefined,
    visitorId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
    // אפשר להוסיף עוד שדות
  });

  // נמשיך הלאה
  next();
}

module.exports = loggingMiddleware; 