const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest } = require('../middlewares/inputValidation');
const controller = require('../controllers/saleFavoritesController');

router.post('/toggle', requireAuth, writeLimiter, sanitizeRequest, controller.toggleFavorite);
router.get('/my', requireAuth, generalLimiter, sanitizeRequest, controller.getUserFavorites);

module.exports = router;


