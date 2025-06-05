const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/home', statsController.getHomeStats);

module.exports = router; 