const express = require('express');
const businessesController = require('../controllers/businessesController');
const router = express.Router();
const upload = require('../config/multerConfig');

router
    .route('/')
    .get(businessesController.getItems)
    .post(upload.single('logo'), businessesController.uploadBusinesses);

router
    .route('/user-businesses')
    .get(businessesController.getUserBusinesses);

module.exports = router;
