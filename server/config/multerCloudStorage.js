/**
 * Multer Configuration for Cloud Storage
 * 
 * This configuration uses memory storage with Multer
 * and uploads to Google Cloud Storage.
 * 
 * Falls back to local disk storage in development if GCS is not configured.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { uploadToGCS, isCloudStorageEnabled } = require('./cloudStorage');

// Check if we should use Cloud Storage
const useCloudStorage = isCloudStorageEnabled();

/**
 * Memory storage for Cloud Storage uploads
 */
const memoryStorage = multer.memoryStorage();

/**
 * Local disk storage (fallback for development)
 */
const createDiskStorage = () => {
  const uploadDir = path.join(__dirname, 'uploads');
  
  // Ensure uploads folder exists
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info({
        message: 'Local uploads directory created',
        uploadDir,
        logSource: 'multerCloudStorage',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to create local uploads directory',
        error: error.message,
        logSource: 'multerCloudStorage',
      });
    }
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.]/g, '_')
        .replace(/_+/g, '_');
      cb(null, `${timestamp}-${sanitizedName}`);
    },
  });
};

/**
 * File filter - validates file types
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    logger.warn({
      message: 'Invalid file type uploaded',
      fileName: file.originalname,
      mimeType: file.mimetype,
      allowedTypes,
      logSource: 'multerCloudStorage.fileFilter',
    });
    return cb(new Error('Only JPEG, PNG, GIF, and WebP files are allowed'), false);
  }
  
  logger.info({
    message: 'File type validated',
    fileName: file.originalname,
    mimeType: file.mimetype,
    logSource: 'multerCloudStorage.fileFilter',
  });
  
  cb(null, true);
};

/**
 * Create multer upload instance
 */
const storage = useCloudStorage ? memoryStorage : createDiskStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10, // Max 10 files per request
  },
  fileFilter,
});

/**
 * Middleware to handle file upload to Cloud Storage
 * Use this AFTER multer middleware
 * 
 * @param {string} folder - Destination folder in GCS bucket
 * @returns {Function} Express middleware
 */
const uploadToCloudStorage = (folder = 'uploads') => {
  return async (req, res, next) => {
    // Skip if not using Cloud Storage
    if (!useCloudStorage) {
      // For local storage, set the URL path
      if (req.file) {
        req.file.cloudStorageUrl = `/uploads/${req.file.filename}`;
      }
      if (req.files) {
        for (const file of req.files) {
          file.cloudStorageUrl = `/uploads/${file.filename}`;
        }
      }
      return next();
    }

    try {
      // Handle single file upload
      if (req.file) {
        const url = await uploadToGCS(req.file, folder);
        req.file.cloudStorageUrl = url;
        logger.info({
          message: 'Single file uploaded to Cloud Storage',
          url,
          originalName: req.file.originalname,
          logSource: 'multerCloudStorage.uploadToCloudStorage',
        });
      }

      // Handle multiple file uploads
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const url = await uploadToGCS(file, folder);
          file.cloudStorageUrl = url;
        }
        logger.info({
          message: 'Multiple files uploaded to Cloud Storage',
          count: req.files.length,
          logSource: 'multerCloudStorage.uploadToCloudStorage',
        });
      }

      // Handle fields with multiple files
      if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
        for (const fieldName of Object.keys(req.files)) {
          for (const file of req.files[fieldName]) {
            const url = await uploadToGCS(file, folder);
            file.cloudStorageUrl = url;
          }
        }
      }

      next();
    } catch (error) {
      logger.error({
        message: 'Cloud Storage upload failed',
        error: error.message,
        stack: error.stack,
        logSource: 'multerCloudStorage.uploadToCloudStorage',
      });
      next(error);
    }
  };
};

/**
 * Combined middleware: multer + cloud storage upload
 * 
 * @param {string} fieldName - Form field name for file
 * @param {string} folder - Destination folder in GCS
 * @returns {Array} Array of middleware functions
 */
const singleUpload = (fieldName, folder = 'uploads') => [
  upload.single(fieldName),
  uploadToCloudStorage(folder),
];

const multipleUpload = (fieldName, maxCount = 10, folder = 'uploads') => [
  upload.array(fieldName, maxCount),
  uploadToCloudStorage(folder),
];

// Log configuration on startup
logger.info({
  message: 'Multer configuration initialized',
  useCloudStorage,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  logSource: 'multerCloudStorage',
});

module.exports = {
  upload,
  uploadToCloudStorage,
  singleUpload,
  multipleUpload,
  useCloudStorage,
};

