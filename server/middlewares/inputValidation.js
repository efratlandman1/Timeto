const { body, param, query, validationResult } = require('express-validator');

// Enhanced input sanitization function
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove potential XSS and NoSQL injection
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/\$[a-zA-Z]+/g, '') // Remove MongoDB operators like $gt, $lt, etc.
            .replace(/[<>{}]/g, '') // Remove potential object injection characters
            .trim();
    }
    return input;
};

// Comprehensive sanitization for all request data
const sanitizeRequest = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitizeInput(req.body[key]);
        });
    }
    
    // Sanitize URL parameters
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            req.params[key] = sanitizeInput(req.params[key]);
        });
    }
    
    // Sanitize query strings
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            req.query[key] = sanitizeInput(req.query[key]);
        });
    }
    
    next();
};

// Enhanced validation schemas with strict type checking
const businessSchema = [
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Name must be a string between 2 and 100 characters'),
    body('address').isString().isLength({ min: 5, max: 200 }).withMessage('Address must be a string between 5 and 200 characters'),
    body('phone').isString().matches(/^[0-9-+\s()]+$/).withMessage('Phone must be a string containing only numbers, spaces, hyphens, plus signs, and parentheses'),
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be a string less than 1000 characters'),
    body('categoryId').isString().isMongoId().withMessage('Category ID must be a valid MongoDB ID string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const userSchema = [
    body('firstName').isString().isLength({ min: 2, max: 50 }).withMessage('First name must be a string between 2 and 50 characters'),
    body('lastName').isString().isLength({ min: 2, max: 50 }).withMessage('Last name must be a string between 2 and 50 characters'),
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('password').isString().isLength({ min: 6, max: 100 }).withMessage('Password must be a string between 6 and 100 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const authSchema = [
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('password').isString().notEmpty().withMessage('Password is required and must be a string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const categorySchema = [
    body('name').isString().isLength({ min: 2, max: 50 }).withMessage('Category name must be a string between 2 and 50 characters'),
    body('color').optional().isString().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const serviceSchema = [
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Service name must be a string between 2 and 100 characters'),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be a string less than 500 characters'),
    body('categoryId').isString().isMongoId().withMessage('Category ID must be a valid MongoDB ID string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const feedbackSchema = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be a string less than 1000 characters'),
    body('businessId').isString().isMongoId().withMessage('Business ID must be a valid MongoDB ID string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const favoriteSchema = [
    body('businessId').isString().isMongoId().withMessage('Business ID must be a valid MongoDB ID string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

const suggestionSchema = [
    body('title').isString().isLength({ min: 5, max: 100 }).withMessage('Title must be a string between 5 and 100 characters'),
    body('description').isString().isLength({ min: 10, max: 1000 }).withMessage('Description must be a string between 10 and 1000 characters'),
    body('type').isString().isIn(['business', 'feature', 'bug', 'other']).withMessage('Type must be a string: business, feature, bug, or other'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

// Generic MongoDB ID validation function
const validateMongoIdParam = (paramName = 'id', displayName = 'ID') => [
    param(paramName).isString().isMongoId().withMessage(`${displayName} must be a valid MongoDB ID string`),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

// Enhanced query string validation schemas with strict type checking
const searchQuerySchema = [
    query('q').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Search query must be a string between 1 and 100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
    query('category').optional().isString().isMongoId().withMessage('Category must be a valid MongoDB ID string'),
    query('location').optional().isString().isLength({ max: 200 }).withMessage('Location must be a string less than 200 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: errors.array()[0].msg
            });
        }
        next();
    }
];

module.exports = {
    sanitizeRequest,
    validateBusiness: businessSchema,
    validateUser: userSchema,
    validateAuth: authSchema,
    validateCategory: categorySchema,
    validateService: serviceSchema,
    validateFeedback: feedbackSchema,
    validateFavorite: favoriteSchema,
    validateSuggestion: suggestionSchema,
    validateMongoIdParam: validateMongoIdParam,
    validateSearchQuery: searchQuerySchema
}; 