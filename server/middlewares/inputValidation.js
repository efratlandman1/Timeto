const { body, param, query, validationResult } = require('express-validator');
const logger = require('../logger');
const Sentry = require('../sentry');

// Helper function to handle validation errors with logging
const handleValidationErrors = (req, res, next, schemaName) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const logSource = `inputValidation.${schemaName}`;
        const meta = {
            requestId: req.requestId,
            userId: req.user?._id,
            ip: req.ip,
            logSource
        };
        
        logger.warn({ 
            ...meta,
            errors: errors.array(),
            msg: `${schemaName} validation failed`
        });
        
        Sentry.captureException(new Error(`${schemaName} validation failed: ${errors.array().map(e => `${e.param}: ${e.msg}`).join(', ')}`));
        
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: errors.array().map(e => ({
                field: e.param,
                message: e.msg,
                value: e.value
            }))
        });
    }
    next();
};

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

function parseArrayFieldsGeneric(fields = ['services', 'openingHours']) {
  return function (req, res, next) {
    fields.forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // If parsing fails, leave as string (validation will catch it)
        }
      }
    });
    next();
  };
}


// Enhanced validation schemas with strict type checking
const businessSchema = [
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Name must be a string between 2 and 100 characters'),
    body('address').isString().isLength({ min: 5, max: 200 }).withMessage('Address must be a string between 5 and 200 characters'),
    body('prefix').isString().isLength({ min: 1, max: 10 }).withMessage('Prefix is required'),
    body('phone').isString().matches(/^[0-9-+\s()]+$/).withMessage('Phone must be a string containing only numbers, spaces, hyphens, plus signs, and parentheses'),
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('categoryId').isString().isMongoId().withMessage('Category ID must be a valid MongoDB ID string'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be a string less than 1000 characters'),
    body('logo').optional().isString().withMessage('Logo must be a string'),
    body('services').optional().isArray().withMessage('Services must be an array'),
    body('openingHours').isArray({ min: 1 }).withMessage('OpeningHours must be a non-empty array'),
    body('openingHours.*.day').isInt({ min: 0, max: 6 }).withMessage('Each openingHours.day must be an integer (0-6)'),
    // userId is set by server, not required from client
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'businessSchema');
    }
];

const userSchema = [
    body('firstName').optional().isString().isLength({ min: 2, max: 50 }).withMessage('First name must be a string between 2 and 50 characters'),
    body('lastName').optional().isString().isLength({ min: 2, max: 50 }).withMessage('Last name must be a string between 2 and 50 characters'),
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('password').optional().isString().isLength({ min: 6, max: 100 }).withMessage('Password must be a string between 6 and 100 characters'),
    body('phonePrefix').optional().isString().isLength({ min: 1, max: 6 }).withMessage('Phone prefix must be a string'),
    body('phone').optional().isString().isLength({ min: 4, max: 20 }).withMessage('Phone must be a string'),
    body('nickname').optional().isString().isLength({ min: 2, max: 50 }).withMessage('Nickname must be a string'),
    body('role').optional().isString().isIn(['admin', 'manager', 'end-user']).withMessage('Role must be admin, manager, or end-user'),
    body('authProvider').optional().isString().isIn(['local', 'google']).withMessage('authProvider must be local or google'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'userSchema');
    }
];

const authSchema = [
    body('email').isString().isEmail().withMessage('Must be a valid email string'),
    body('password').isString().notEmpty().withMessage('Password is required and must be a string'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'authSchema');
    }
];

const categorySchema = [
    body('name').isString().isLength({ min: 2, max: 50 }).withMessage('Category name must be a string between 2 and 50 characters'),
    body('logo').isString().withMessage('Logo is required and must be a string'),
    body('color').optional().isString().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color string'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'categorySchema');
    }
];

const serviceSchema = [
    body('categoryId').isString().isMongoId().withMessage('Category ID must be a valid MongoDB ID string'),
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Service name must be a string between 2 and 100 characters'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'serviceSchema');
    }
];

const feedbackSchema = [
    // body('user_id').isString().isMongoId().withMessage('user_id must be a valid MongoDB ID string'),
    body('business_id').isString().isMongoId().withMessage('business_id must be a valid MongoDB ID string'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be a string less than 1000 characters'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'feedbackSchema');
    }
];

const favoriteSchema = [
    // body('user_id').isString().isMongoId().withMessage('user_id must be a valid MongoDB ID string'),
    body('business_id').isString().isMongoId().withMessage('business_id must be a valid MongoDB ID string'),
    (req, res, next) => {
        handleValidationErrors(req, res, next, 'favoriteSchema');
    }
];

const validateSuggestion = [
  body('type')
    .isString()
    .isIn(['category', 'service'])
    .withMessage('Type must be either category or service'),
  body('name_he')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hebrew name is required (2-100 chars)'),
  body('name_en')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('English name is required (2-100 chars)'),
  body('parent_category_id')
    .if(body('type').equals('service'))
    .isString()
    .isMongoId()
    .withMessage('parent_category_id is required and must be a valid Mongo ID for service suggestions'),
  (req, res, next) => {
    handleValidationErrors(req, res, next, 'validateSuggestion');
  }
];

// Generic MongoDB ID validation function
const validateMongoIdParam = (paramName = 'id', displayName = 'ID') => [
    param(paramName).isString().isMongoId().withMessage(`${displayName} must be a valid MongoDB ID string`),
    (req, res, next) => {
        handleValidationErrors(req, res, next, `validateMongoIdParam.${paramName}`);
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
        handleValidationErrors(req, res, next, 'searchQuerySchema');
    }
];

module.exports = {
    sanitizeRequest,
    parseArrayFieldsGeneric,
    validateBusiness: businessSchema,
    validateUser: userSchema,
    validateAuth: authSchema,
    validateCategory: categorySchema,
    validateService: serviceSchema,
    validateFeedback: feedbackSchema,
    validateFavorite: favoriteSchema,
    validateSuggestion: validateSuggestion,
    validateMongoIdParam: validateMongoIdParam,
    validateSearchQuery: searchQuerySchema
}; 