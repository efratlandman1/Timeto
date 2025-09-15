const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV, // או SENTRY_ENV אם תרצי
  // TODO: החזר tracing כשנשדרג ל-Node.js 16+
  // tracesSampleRate: 0.1, // אפשר לשנות לפי הצורך
  tags: {
    service: 'business-search-api'
  },
  beforeSend(event) {
    // סינון Authorization header
    if (event.request && event.request.headers && event.request.headers.authorization) {
      event.request.headers.authorization = '[FILTERED]';
    }
    // סינון סיסמאות (כבר קיים)
    if (event.request && event.request.data && event.request.data.password) {
      event.request.data.password = '[FILTERED]';
    }
    return event;
  },
});

module.exports = Sentry;