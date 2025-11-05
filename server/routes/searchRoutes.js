const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const { sanitizeRequest } = require('../middlewares/inputValidation');
const controller = require('../controllers/searchController');

router.get('/all', optionalAuth, sanitizeRequest, controller.getAllUnified);

module.exports = router;


