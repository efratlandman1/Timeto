const path = require('path');
const fs = require('fs');

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
        
        return res.status(400).json({
            success: false,
            message: 'Invalid file type',
            details: `Only ${Object.values(ALLOWED_FILE_TYPES).join(', ')} files are allowed`
        });
    }
    
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
        
        return res.status(400).json({
            success: false,
            message: 'File too large',
            details: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
    }
    
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
    } catch (error) {
        console.error('Error renaming file:', error);
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
        
        return res.status(400).json({
            success: false,
            message: 'Invalid file content',
            details: 'File appears to be corrupted or not a valid image'
        });
    }
    
    next();
};

// Combined file upload security middleware
const fileUploadSecurity = [
    validateFileType,
    validateFileSize,
    sanitizeFileName,
    checkFileContent
];

module.exports = {
    validateFileType,
    validateFileSize,
    sanitizeFileName,
    checkFileContent,
    fileUploadSecurity
}; 