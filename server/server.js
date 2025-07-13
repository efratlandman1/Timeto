const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const app = express();
require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'CLIENT_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'config', 'uploads')));

mongoose.connect(MONGO_URI)
   .then(() => console.log('MongoDB connected'))
   .catch(err => console.error(err));

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
