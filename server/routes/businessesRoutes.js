const express = require('express');
const businessesController = require('../controllers/businessesController');
const router = express.Router();
const upload = require('../config/multerConfig');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

router
    .route('/')
    .get(optionalAuth, generalLimiter, businessesController.getItems)
    .post(requireAuth, writeLimiter, upload.single('logo'), businessesController.uploadBusinesses);

router
    .route('/all')
    .get(optionalAuth, generalLimiter, businessesController.getAllBusinesses);
    
router
    .route('/user-businesses')
    .get(requireAuth, generalLimiter, businessesController.getUserBusinesses);

// router
//     .get('/search', businessesController.searchBusinesses);

router
  .route('/:id')
  .get(optionalAuth, generalLimiter, businessesController.getBusinessById)
  .delete(requireAuth, writeLimiter, businessesController.deleteBusiness);

router
  .patch('/restore/:id', requireAuth, writeLimiter, businessesController.restoreBusiness);

  
module.exports = router;

