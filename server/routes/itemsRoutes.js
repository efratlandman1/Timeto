const express = require('express');
const itemController = require('../controllers/itemsController');
const router = express.Router();
const upload = require('../config/multerConfig');

router
    .route('/')
    .get(itemController.getItems)
    .post(upload.single('photos'), itemController.uploadItem);

router
    .route('/user-items')
    .get(itemController.getUserItems);

module.exports = router;
