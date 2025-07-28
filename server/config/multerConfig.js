const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const Sentry = require('../sentry');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir);
        logger.info({ 
            msg: 'Uploads directory created',
            uploadDir,
            logSource: 'multerConfig'
        });
    } catch (error) {
        logger.error({ 
            msg: 'Failed to create uploads directory',
            error: error.message,
            uploadDir,
            logSource: 'multerConfig'
        });
        Sentry.captureException(error);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
                logger.info({ 
                    msg: 'Uploads directory created during file upload',
                    uploadDir,
                    fileName: file.originalname,
                    logSource: 'multerConfig.storage.destination'
                });
            } catch (error) {
                logger.error({ 
                    msg: 'Failed to create uploads directory during file upload',
                    error: error.message,
                    uploadDir,
                    fileName: file.originalname,
                    logSource: 'multerConfig.storage.destination'
                });
                Sentry.captureException(error);
                return cb(error);
            }
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        try {
            // Basic filename sanitization
            const originalName = file.originalname;
            const extension = path.extname(originalName).toLowerCase();
            const baseName = path.basename(originalName, extension);
            
            // Remove special characters and spaces
            const sanitizedName = baseName
                .replace(/[^a-zA-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            const timestamp = Date.now();
            const newFileName = `${sanitizedName}_${timestamp}${extension}`;
            
            logger.info({ 
                msg: 'File name sanitized for upload',
                originalName,
                sanitizedName: newFileName,
                logSource: 'multerConfig.storage.filename'
            });
            
            cb(null, newFileName);
        } catch (error) {
            logger.error({ 
                msg: 'Failed to sanitize filename',
                error: error.message,
                originalName: file.originalname,
                logSource: 'multerConfig.storage.filename'
            });
            Sentry.captureException(error);
            cb(error);
        }
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        logger.warn({ 
            msg: 'Invalid file type uploaded',
            fileName: file.originalname,
            mimeType: file.mimetype,
            allowedTypes,
            logSource: 'multerConfig.fileFilter'
        });
        
        Sentry.captureException(new Error(`Invalid file type uploaded: ${file.mimetype} for file: ${file.originalname}`));
        
        return cb(new Error('Only JPEG, PNG, GIF, and WebP files are allowed'));
    }
    
    logger.info({ 
        msg: 'File type validated successfully',
        fileName: file.originalname,
        mimeType: file.mimetype,
        logSource: 'multerConfig.fileFilter'
    });
    
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: fileFilter
});

module.exports = upload;
