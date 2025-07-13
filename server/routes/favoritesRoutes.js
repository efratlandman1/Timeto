const express = require('express');
const favoritesController = require('../controllers/favoritesController');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

router.post('/toggle', requireAuth, writeLimiter, favoritesController.toggleFavorite);
router.get('/user-favorites', requireAuth, generalLimiter, favoritesController.getUserFavorites);
router.get('/status/:businessId', requireAuth, generalLimiter, favoritesController.checkFavoriteStatus);

module.exports = router; 