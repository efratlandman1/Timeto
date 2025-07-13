const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { publicRoute } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.get('/home', publicRoute, generalLimiter, statsController.getHomeStats);

module.exports = router; 