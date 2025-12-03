/**
 * Cloud Run Optimized Logger
 * 
 * This logger is optimized for Google Cloud Run:
 * - Outputs structured JSON to stdout (captured by Cloud Logging)
 * - Uses Cloud Logging severity levels
 * - Supports local development with pretty printing
 * - No file system writes (stateless)
 */

const pino = require('pino');

// Cloud Logging severity levels mapping
const CLOUD_LOGGING_SEVERITY = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

// Determine if running in Cloud Run
const isCloudRun = process.env.K_SERVICE !== undefined;
const isDevelopment = process.env.NODE_ENV === 'dev';

/**
 * Create logger configuration based on environment
 */
const createLoggerConfig = () => {
  const baseConfig = {
    level: process.env.LOG_LEVEL || 'info',
    // Use 'message' as the key for Cloud Logging compatibility
    messageKey: 'message',
    // Timestamp in ISO format
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    // Format for Cloud Logging
    formatters: {
      level(label, number) {
        return {
          severity: CLOUD_LOGGING_SEVERITY[label] || 'DEFAULT',
          level: number,
          level_name: label.toUpperCase(),
        };
      },
      bindings(bindings) {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          // Add Cloud Run specific metadata
          ...(isCloudRun && {
            'logging.googleapis.com/labels': {
              service: process.env.K_SERVICE,
              revision: process.env.K_REVISION,
            },
          }),
        };
      },
    },
    // Base context
    base: {
      service: 'timeto-api',
      environment: process.env.NODE_ENV || 'unknown',
    },
  };

  return baseConfig;
};

/**
 * Create transport configuration
 */
const createTransport = () => {
  // In development, use pretty printing to console
  if (isDevelopment && !isCloudRun) {
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageKey: 'message',
      },
    });
  }

  // In Cloud Run / Production, output raw JSON to stdout
  // Cloud Logging will automatically parse it
  return undefined; // Use default stdout
};

// Create the logger instance
const transport = createTransport();
const config = createLoggerConfig();

const logger = transport
  ? pino(config, transport)
  : pino(config);

// Log startup information
logger.info({
  message: 'Logger initialized',
  isCloudRun,
  isDevelopment,
  logLevel: config.level,
  logSource: 'logger',
});

module.exports = logger;

