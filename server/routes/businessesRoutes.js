const express = require('express');
const businessesController = require('../controllers/businessesController');
const router = express.Router();
const upload = require('../config/multerConfig');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');

router
    .route('/')
    .get(optionalAuth, businessesController.getItems)
    .post(requireAuth, upload.single('logo'), businessesController.uploadBusinesses);

router
    .route('/all')
    .get(optionalAuth, businessesController.getAllBusinesses);
    
router
    .route('/user-businesses')
    .get(requireAuth, businessesController.getUserBusinesses);

// router
//     .get('/search', businessesController.searchBusinesses);

router
  .route('/:id')
  .get(optionalAuth, businessesController.getBusinessById)
  .delete(requireAuth, businessesController.deleteBusiness);

router
  .patch('/restore/:id', requireAuth, businessesController.restoreBusiness);

  
module.exports = router;

