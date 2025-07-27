const Sentry = require('../sentry');

const captureError = (err, req) => {
  const userData = req.user?._id ? { id: req.user._id } : { id: req.visitorId, isGuest: true };
  const extra = {};
  if (req.requestId) {
    extra.tags = { requestId: req.requestId };
  }
  Sentry.captureException(err, { user: userData, ...extra });
};

function getRequestMeta(req, logSource) {
  return {
    requestId: req.requestId,
    userId: req.user?._id ? req.user._id.toString() : undefined,
    role: req.user?.role || 'guest',
    isGuest: !req.user,
    visitorId: req.visitorId ? req.visitorId.toString() : undefined,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    logSource
  };
}

// Unified error response function
function errorResponse({ res, req, status = 500, message, logSource }) {
  if (req?.requestId) {
    res.set('X-Request-Id', req.requestId);
  }
  return res.status(status).json({
    error: message,
    requestId: req.requestId,
    logSource
  });
}

function successResponse({ res, req, status = 200, data, message, logSource }) {
  if (req?.requestId) {
    res.set('X-Request-Id', req.requestId);
  }
  return res.status(status).json({
    success: true,
    data,
    message,
    requestId: req.requestId,
    logSource
  });
}

function serializeError(err) {
  if (!err) return null;
  return {
    message: err.message,
    stack: err.stack,
    name: err.name,
    ...err // כולל שדות נוספים אם יש
  };
}


module.exports = {
  captureError,
  errorResponse,
  successResponse,
  getRequestMeta,
  serializeError
}; 