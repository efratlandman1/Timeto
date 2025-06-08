const express = require('express');
const businessesController = require('../controllers/businessesController');
const router = express.Router();
const upload = require('../config/multerConfig');

router
    .route('/')
    .get(businessesController.getItems)
    .post(upload.single('logo'), businessesController.uploadBusinesses);

router
    .route('/all')
    .get(businessesController.getAllBusinesses);
    
router
    .route('/user-businesses')
    .get(businessesController.getUserBusinesses);

// router
//     .get('/search', businessesController.searchBusinesses);

router
  .route('/:id')
  .get(businessesController.getBusinessById)
  .delete(businessesController.deleteBusiness);

router
  .patch('/restore/:id', businessesController.restoreBusiness);

  
module.exports = router;

