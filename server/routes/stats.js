const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { publicRoute } = require('../middlewares/authMiddleware');

router.get('/home', publicRoute, statsController.getHomeStats);

module.exports = router; 