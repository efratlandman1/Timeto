const express = require('express');
const favoritesController = require('../controllers/favoritesController');
const router = express.Router();

router.post('/toggle', favoritesController.toggleFavorite);
router.get('/user-favorites', favoritesController.getUserFavorites);
router.get('/status/:businessId', favoritesController.checkFavoriteStatus);

module.exports = router; 