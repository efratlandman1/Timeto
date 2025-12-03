const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { publicRoute } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');

// Health check endpoint for Cloud Run
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'timeto-api',
    version: process.env.npm_package_version || '1.0.0',
  });
});

router.get('/home', publicRoute, generalLimiter, statsController.getHomeStats);

module.exports = router; 