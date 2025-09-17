const path = require('path');
const fs = require('fs');
const NodeClam = require('clamscan');
const logger = require('../logger');
const Sentry = require('../sentry');

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ClamAV configuration
let clamscan = null;
let clamAvailable = false;

// Initialize ClamAV only if in production
const isProduction = process.env.NODE_ENV === 'prod' ;

(async () => {
    if (isProduction) {
        try {
            clamscan = await new NodeClam().init({
                removeInfected: false,
                quarantineInfected: false,
                scanLog: null,
                debugMode: false,
                clamscan: {
                    path: process.platform === 'win32'
                        ? 'C:\\Program Files\\ClamAV\\clamscan.exe'
                        : '/usr/bin/clamscan',
                },
            });
            clamAvailable = true;
            logger.info({ 
                msg: 'ClamAV initialized and ready for virus scanning',
                logSource: 'fileUploadSecurity'
            });
        } catch (err) {
            clamAvailable = false;
            logger.warn({ 
                msg: 'ClamAV not available. Virus scanning is disabled',
                error: err.message,
                logSource: 'fileUploadSecurity'
            });
            Sentry.captureException(err);
        }
    }
})();

// Virus scanning middleware
const virusScan = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    // Skip virus scan in development
    if (!isProduction) {
        logger.info({ 
            msg: 'Skipping virus scan (development environment)',
            logSource: 'fileUploadSecurity.virusScan'
        });
        return next();
    }

    // Skip if ClamAV is not available
    if (!clamAvailable) {
        logger.warn({ 
            msg: 'ClamAV not available. Skipping virus scan.',
            logSource: 'fileUploadSecurity.virusScan'
        });
        return next();
    }

    try {
        const { isInfected, viruses } = await clamscan.isInfected(req.file.path);
        if (isInfected) {
            // Delete the infected file
            if (req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            logger.warn({ 
                msg: 'File failed virus scan',
                fileName: req.file.originalname,
                viruses: viruses,
                logSource: 'fileUploadSecurity.virusScan'
            });
            
            Sentry.captureException(new Error(`Virus detected in file: ${req.file.originalname} - ${viruses.join(', ')}`));
            
            return res.status(400).json({
                success: false,
                message: 'File failed virus scan',
                details: `Virus detected: ${viruses.join(', ')}`
            });
        }
        
        logger.info({ 
            msg: 'File passed virus scan',
            fileName: req.file.originalname,
            logSource: 'fileUploadSecurity.virusScan'
        });
        next();
    } catch (err) {
        logger.error({ 
            msg: 'Virus scan error',
            error: err.message,
            stack: err.stack,
            fileName: req.file?.originalname,
            logSource: 'fileUploadSecurity.virusScan'
        });
        
        Sentry.captureException(err);
        
        // Delete the file if scan failed
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
            success: false,
            message: 'Virus scan failed',
            details: 'Unable to scan file for viruses'
        });
    }
};

// Validate file type
const validateFileType = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const mimeType = req.file.mimetype;
    
    if (!ALLOWED_FILE_TYPES[mimeType]) {
        // Delete the uploaded file if it's invalid
        if (req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        logger.warn({ 
            msg: 'Invalid file type',
            fileName: req.file.originalname,
            mimeType: mimeType,
            logSource: 'fileUploadSecurity.validateFileType'
        });
        
        return res.status(400).json({
            success: false,
            message: 'Invalid file type',
            details: `Only ${Object.values(ALLOWED_FILE_TYPES).join(', ')} files are allowed`
        });
    }
    
    logger.info({ 
        msg: 'File type validated',
        fileName: req.file.originalname,
        logSource: 'fileUploadSecurity.validateFileType'
    });
    next();
};

// Validate file size
const validateFileSize = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    if (req.file.size > MAX_FILE_SIZE) {
        // Delete the uploaded file if it's too large
        if (req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        logger.warn({ 
            msg: 'File too large',
            fileName: req.file.originalname,
            fileSize: req.file.size,
            logSource: 'fileUploadSecurity.validateFileSize'
        });
        
        return res.status(400).json({
            success: false,
            message: 'File too large',
            details: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
    }
    
    logger.info({ 
        msg: 'File size validated',
        fileName: req.file.originalname,
        logSource: 'fileUploadSecurity.validateFileSize'
    });
    next();
};

// Sanitize filename
const sanitizeFileName = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, extension);
    
    // Remove special characters and spaces
    const sanitizedName = baseName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    
    // Add timestamp to prevent conflicts
    const timestamp = Date.now();
    const newFileName = `${sanitizedName}_${timestamp}${extension}`;
    
    // Update the file object
    req.file.filename = newFileName;
    
    // Rename the file on disk
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFileName);
    
    try {
        fs.renameSync(oldPath, newPath);
        req.file.path = newPath;
        logger.info({ 
            msg: 'File name sanitized',
            fileName: originalName,
            sanitizedName: newFileName,
            logSource: 'fileUploadSecurity.sanitizeFileName'
        });
    } catch (error) {
        logger.error({ 
            msg: 'Error renaming file',
            error: error.message,
            fileName: originalName,
            logSource: 'fileUploadSecurity.sanitizeFileName'
        });
    }
    
    next();
};

// Check for malicious content in file
const checkFileContent = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    // Read first few bytes to check file signature
    const buffer = fs.readFileSync(req.file.path);
    const fileSignature = buffer.toString('hex', 0, 4);
    
    // Check for common image file signatures
    const validSignatures = [
        'ffd8ff', // JPEG
        '89504e47', // PNG
        '47494638', // GIF
        '52494646'  // WebP
    ];
    
    const isValidSignature = validSignatures.some(sig => 
        fileSignature.toLowerCase().startsWith(sig)
    );
    
    if (!isValidSignature) {
        // Delete the file if signature is invalid
        fs.unlinkSync(req.file.path);
        
        logger.warn({ 
            msg: 'Invalid file content',
            fileName: req.file.originalname,
            fileSignature: fileSignature,
            logSource: 'fileUploadSecurity.checkFileContent'
        });
        
        return res.status(400).json({
            success: false,
            message: 'Invalid file content',
            details: 'File appears to be corrupted or not a valid image'
        });
    }
    
    logger.info({ 
        msg: 'File content checked',
        fileName: req.file.originalname,
        logSource: 'fileUploadSecurity.checkFileContent'
    });
    next();
};

// Combined file upload security middleware (single file)
const fileUploadSecurity = [
    validateFileType,
    validateFileSize,
    sanitizeFileName,
    checkFileContent,
    virusScan
];

// Array-aware variants for multiple files
const fileUploadSecurityArray = async (req, res, next) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next();
    }

    try {
        // Validate each file
        for (const file of req.files) {
            // Type
            if (!ALLOWED_FILE_TYPES[file.mimetype]) {
                if (file.path) { try { fs.unlinkSync(file.path); } catch (_) {} }
                return res.status(400).json({ success: false, message: 'Invalid file type', details: `Only ${Object.values(ALLOWED_FILE_TYPES).join(', ')} files are allowed` });
            }
            // Size
            if (file.size > MAX_FILE_SIZE) {
                if (file.path) { try { fs.unlinkSync(file.path); } catch (_) {} }
                return res.status(400).json({ success: false, message: 'File too large', details: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
            }
            // Sanitize filename and rename
            const originalName = file.originalname;
            const extension = path.extname(originalName).toLowerCase();
            const baseName = path.basename(originalName, extension);
            const sanitizedName = baseName
                .replace(/[^a-zA-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            const timestamp = Date.now();
            const newFileName = `${sanitizedName}_${timestamp}${extension}`;
            const oldPath = file.path;
            const newPath = path.join(path.dirname(oldPath), newFileName);
            try {
                fs.renameSync(oldPath, newPath);
                file.filename = newFileName;
                file.path = newPath;
            } catch (_) {}
            // Check signature
            try {
                const buffer = fs.readFileSync(file.path);
                const fileSignature = buffer.toString('hex', 0, 4);
                const validSignatures = ['ffd8ff','89504e47','47494638','52494646'];
                const isValidSignature = validSignatures.some(sig => fileSignature.toLowerCase().startsWith(sig));
                if (!isValidSignature) {
                    try { fs.unlinkSync(file.path); } catch (_) {}
                    return res.status(400).json({ success: false, message: 'Invalid file content', details: 'File appears to be corrupted or not a valid image' });
                }
            } catch (_) {
                // If fail to read, reject
                try { fs.unlinkSync(file.path); } catch (_) {}
                return res.status(400).json({ success: false, message: 'Invalid file content', details: 'Unable to read uploaded file' });
            }
        }

        // Virus scan (production only)
        if (isProduction && clamAvailable) {
            for (const file of req.files) {
                const { isInfected, viruses } = await clamscan.isInfected(file.path);
                if (isInfected) {
                    try { fs.unlinkSync(file.path); } catch (_) {}
                    return res.status(400).json({ success: false, message: 'File failed virus scan', details: `Virus detected: ${viruses.join(', ')}` });
                }
            }
        }

        return next();
    } catch (err) {
        Sentry.captureException(err);
        return res.status(500).json({ success: false, message: 'File validation failed' });
    }
};

module.exports = {
    validateFileType,
    validateFileSize,
    sanitizeFileName,
    checkFileContent,
    virusScan,
    fileUploadSecurity,
    fileUploadSecurityArray
}; 