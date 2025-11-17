const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const { sanitizeRequest } = require('../middlewares/inputValidation');
const { searchSlowDown } = require('../middlewares/rateLimiter');
const controller = require('../controllers/searchController');

// Soft slowdown to deter scraping while not blocking normal users
router.get('/all', searchSlowDown, optionalAuth, sanitizeRequest, controller.getAllUnified);

module.exports = router;


