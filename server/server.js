const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const logger = require('./logger');
const Sentry = require('./sentry');
const app = express();
require('dotenv').config({ path: '.env' });

// require('dotenv').config({ quiet: true })
// require('dotenv').config({ path: '.env' });

// Validate critical environment variables
const requiredEnvVars = [
  'MONGO_URI', 
  'CLIENT_URL', 
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_MAPS_API_KEY',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASS',
  'SERVER_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error({ 
    msg: 'Missing required environment variables',
    missingVars: missingEnvVars,
    logSource: 'server.js'
  });
  Sentry.captureException(new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`));
  process.exit(1);
}

// Additional API key validation
const apiKeysToValidate = ['JWT_SECRET', 'GOOGLE_MAPS_API_KEY', 'GOOGLE_CLIENT_ID', 'EMAIL_PASS'];
const invalidApiKeys = apiKeysToValidate.filter(key => process.env[key] && process.env[key].length < 10);

if (invalidApiKeys.length > 0) {
  logger.error({ 
    msg: 'Invalid API keys (too short)',
    invalidKeys: invalidApiKeys,
    logSource: 'server.js'
  });
  Sentry.captureException(new Error(`Invalid API keys (too short): ${invalidApiKeys.join(', ')}`));
  process.exit(1);
}

logger.info({ 
  msg: 'All environment variables and API keys are valid',
  logSource: 'server.js'
});

const PORT = 5050;
const MONGO_URI = process.env.MONGO_URI;
const usersRouter = require('./routes/usersRoutes');
const businessesRouter = require('./routes/businessesRoutes');
const authRouter = require('./routes/authRoutes');
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require('./routes/serviceRoutes');
const feedbackRoutes  = require('./routes/feedbacksRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const suggestionRouter = require('./routes/suggestionRoutes');
const statsRoutes = require('./routes/stats');
const saleAdsRoutes = require('./routes/saleAdsRoutes');
const promoAdsRoutes = require('./routes/promoAdsRoutes');
const saleCategoriesRoutes = require('./routes/saleCategoriesRoutes');
const saleFavoritesRoutes = require('./routes/saleFavoritesRoutes');
const promoFavoritesRoutes = require('./routes/promoFavoritesRoutes');
const loggingMiddleware = require('./middlewares/loggingMiddleware');

// Security middleware with environment-based settings
const isDevelopment = process.env.NODE_ENV === 'dev';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3030';
const serverUrl = process.env.SERVER_URL || 'http://localhost:5050';

const helmetConfig = {
  crossOriginResourcePolicy: { 
    policy: isDevelopment ? "cross-origin" : "same-origin" 
  },
  crossOriginEmbedderPolicy: isDevelopment ? false : true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", clientUrl, serverUrl],
      connectSrc: ["'self'", clientUrl, serverUrl],
    },
  },
};

app.use(helmet(helmetConfig));
app.use(loggingMiddleware);

// CORS configuration with environment variables
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3030'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request body size limits to prevent memory attacks
const MAX_BODY_SIZE = '10mb'; // 10MB limit for JSON payloads
const MAX_URLENCODED_SIZE = '5mb'; // 5MB limit for URL-encoded data

app.use(express.json({ 
  limit: MAX_BODY_SIZE,
  strict: true // Reject malformed JSON
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: MAX_URLENCODED_SIZE,
  parameterLimit: 1000 // Limit number of parameters
}));

const path = require('path');

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'config', 'uploads')));

// Ensure NODE_ENV is set
if (!process.env.NODE_ENV) {
  logger.error({ 
    msg: 'NODE_ENV is not set',
    logSource: 'server.js'
  });
  Sentry.captureException(new Error('NODE_ENV is not set'));
  process.exit(1);
}

// Secure mongoose connection options
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  // ssl: process.env.NODE_ENV === 'prod', // Enable if you want SSL in production
  // sslValidate: true,
  // authSource: 'admin', // Enable if you use a separate auth DB
};

mongoose.connect(MONGO_URI, mongooseOptions)
   .then(() => {
     logger.info({ 
       msg: 'MongoDB connected successfully',
       connectionString: MONGO_URI.replace(/\/\/.*@/, '//***:***@'), // מסתיר פרטי התחברות
       environment: process.env.NODE_ENV,
       logSource: 'server.js'
     });
   })
   .catch(err => {
     logger.error({ 
       msg: 'MongoDB connection failed',
       error: err.message,
       stack: err.stack,
       logSource: 'server.js'
     });
     Sentry.captureException(err);
     process.exit(1);
   });

// Routes - כל ראוטר יקבל את המידלוור המתאים בתוך הקובץ שלו
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/businesses', businessesRouter);
app.use("/api/v1/categories", categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/feedbacks', feedbackRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/suggestions', suggestionRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/sale-ads', saleAdsRoutes);
app.use('/api/v1/promo-ads', promoAdsRoutes);
app.use('/api/v1/sale-categories', saleCategoriesRoutes);
app.use('/api/v1/sale-favorites', saleFavoritesRoutes);
app.use('/api/v1/promo-favorites', promoFavoritesRoutes);

// Global error handler for oversized requests and other errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ 
      msg: 'Invalid JSON payload received',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      logSource: 'server.js'
    });
    return res.status(400).json({ 
      error: 'Invalid JSON payload',
      message: 'The request body contains malformed JSON'
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    logger.warn({ 
      msg: 'File too large uploaded',
      requestId: req.requestId,
      ip: req.ip,
      fileSize: req.headers['content-length'],
      logSource: 'server.js'
    });
    return res.status(413).json({ 
      error: 'File too large',
      message: 'The uploaded file exceeds the size limit'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    logger.warn({ 
      msg: 'Unexpected file field detected',
      requestId: req.requestId,
      ip: req.ip,
      logSource: 'server.js'
    });
    return res.status(400).json({ 
      error: 'Unexpected file field',
      message: 'An unexpected file field was detected'
    });
  }
  
  // Log the error for debugging
  logger.error({ 
    msg: 'Server error occurred',
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    logSource: 'server.js'
  });
  
  Sentry.captureException(err);
  
  // Generic error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'dev' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
    logger.info({ 
      msg: 'Server started successfully',
      port: PORT,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      logSource: 'server.js'
    });
});
