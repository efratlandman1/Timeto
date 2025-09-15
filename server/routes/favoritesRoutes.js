const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { sanitizeRequest, validateFavorite, validateMongoIdParam } = require('../middlewares/inputValidation');
const { generalLimiter, writeLimiter } = require('../middlewares/rateLimiter');

router.post('/toggle', requireAuth, writeLimiter, sanitizeRequest, validateFavorite, favoritesController.toggleFavorite);
router.get('/user-favorites', requireAuth, generalLimiter, sanitizeRequest, favoritesController.getUserFavorites);
router.get('/status/:businessId', requireAuth, generalLimiter, sanitizeRequest, validateMongoIdParam('businessId', 'Business ID'), favoritesController.checkFavoriteStatus);

module.exports = router; 