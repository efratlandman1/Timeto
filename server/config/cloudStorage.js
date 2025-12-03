/**
 * Google Cloud Storage Configuration for Cloud Run
 * Handles file uploads to GCS bucket instead of local disk
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const logger = require('../logger');

// Initialize Cloud Storage client
// In Cloud Run, credentials are automatically provided via the service account
const storage = new Storage();

const bucketName = process.env.GCS_BUCKET_NAME;

/**
 * Get the Cloud Storage bucket
 * @returns {Bucket} Google Cloud Storage bucket
 */
const getBucket = () => {
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is not set');
  }
  return storage.bucket(bucketName);
};

/**
 * Upload a file to Cloud Storage
 * @param {Object} file - Multer file object (with buffer)
 * @param {string} folder - Destination folder in bucket (e.g., 'uploads', 'logos')
 * @returns {Promise<string>} Public URL of uploaded file
 */
const uploadToGCS = async (file, folder = 'uploads') => {
  const logSource = 'cloudStorage.uploadToGCS';
  
  try {
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is not set');
    }

    const bucket = storage.bucket(bucketName);
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .replace(/_+/g, '_');
    const fileName = `${folder}/${timestamp}-${sanitizedName}`;
    
    const blob = bucket.file(fileName);
    
    // Create write stream with options
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        logger.error({
          msg: 'Failed to upload file to Cloud Storage',
          error: error.message,
          fileName,
          bucket: bucketName,
          logSource,
        });
        reject(error);
      });

      blobStream.on('finish', async () => {
        // Generate public URL
        // Format: https://storage.googleapis.com/BUCKET_NAME/FILE_NAME
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        
        logger.info({
          msg: 'File uploaded successfully to Cloud Storage',
          fileName,
          publicUrl,
          size: file.size,
          mimeType: file.mimetype,
          logSource,
        });
        
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    logger.error({
      msg: 'Cloud Storage upload error',
      error: error.message,
      stack: error.stack,
      logSource,
    });
    throw error;
  }
};

/**
 * Delete a file from Cloud Storage
 * @param {string} fileUrl - Full public URL or file path
 * @returns {Promise<void>}
 */
const deleteFromGCS = async (fileUrl) => {
  const logSource = 'cloudStorage.deleteFromGCS';
  
  try {
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is not set');
    }

    // Extract file path from URL
    let filePath = fileUrl;
    if (fileUrl.includes('storage.googleapis.com')) {
      filePath = fileUrl.split(`${bucketName}/`)[1];
    }

    if (!filePath) {
      logger.warn({
        msg: 'Invalid file URL for deletion',
        fileUrl,
        logSource,
      });
      return;
    }

    const bucket = storage.bucket(bucketName);
    await bucket.file(filePath).delete();
    
    logger.info({
      msg: 'File deleted from Cloud Storage',
      filePath,
      logSource,
    });
  } catch (error) {
    // Don't throw if file doesn't exist
    if (error.code === 404) {
      logger.warn({
        msg: 'File not found in Cloud Storage (already deleted)',
        fileUrl,
        logSource,
      });
      return;
    }
    
    logger.error({
      msg: 'Failed to delete file from Cloud Storage',
      error: error.message,
      fileUrl,
      logSource,
    });
    throw error;
  }
};

/**
 * Generate a signed URL for temporary access
 * @param {string} filePath - Path to file in bucket
 * @param {number} expiresInMinutes - URL expiration time in minutes
 * @returns {Promise<string>} Signed URL
 */
const getSignedUrl = async (filePath, expiresInMinutes = 60) => {
  const logSource = 'cloudStorage.getSignedUrl';
  
  try {
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is not set');
    }

    const bucket = storage.bucket(bucketName);
    const [url] = await bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    logger.info({
      msg: 'Signed URL generated',
      filePath,
      expiresInMinutes,
      logSource,
    });
    
    return url;
  } catch (error) {
    logger.error({
      msg: 'Failed to generate signed URL',
      error: error.message,
      filePath,
      logSource,
    });
    throw error;
  }
};

/**
 * Check if Cloud Storage is properly configured
 * @returns {boolean}
 */
const isCloudStorageEnabled = () => {
  return !!process.env.GCS_BUCKET_NAME;
};

module.exports = {
  storage,
  getBucket,
  uploadToGCS,
  deleteFromGCS,
  getSignedUrl,
  isCloudStorageEnabled,
};

