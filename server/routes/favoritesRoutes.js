const express = require('express');
const favoritesController = require('../controllers/favoritesController');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/toggle', requireAuth, favoritesController.toggleFavorite);
router.get('/user-favorites', requireAuth, favoritesController.getUserFavorites);
router.get('/status/:businessId', requireAuth, favoritesController.checkFavoriteStatus);

module.exports = router; 