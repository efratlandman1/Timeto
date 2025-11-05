const express = require('express');
const businessesController = require('../controllers/businessesController');
const router = express.Router();
const upload = require('../config/multerConfig');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateBusiness, validateMongoIdParam, validateSearchQuery,parseArrayFieldsGeneric} = require('../middlewares/inputValidation');
const { fileUploadSecurity } = require('../middlewares/fileUploadSecurity');

router
    .route('/')
    .get(optionalAuth, sanitizeRequest, validateSearchQuery, businessesController.getItems)
    .post(requireAuth, writeLimiter, sanitizeRequest, upload.single('logo'), fileUploadSecurity,  parseArrayFieldsGeneric(['services', 'openingHours']), validateBusiness, businessesController.uploadBusinesses);

router
    .route('/all')
    .get(optionalAuth, generalLimiter, sanitizeRequest, businessesController.getAllBusinesses);
    
router
    .route('/user-businesses')
    .get(requireAuth, generalLimiter, sanitizeRequest, businessesController.getUserBusinesses);

// router
//     .get('/search', businessesController.searchBusinesses);

router
  .route('/:id')
  .get(optionalAuth, generalLimiter, sanitizeRequest, validateMongoIdParam('id', 'Business ID'), businessesController.getBusinessById)
  .delete(requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Business ID'), businessesController.deleteBusiness);

router
  .patch('/restore/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Business ID'), businessesController.restoreBusiness);

  
module.exports = router;

