const express = require('express');
const suggestionController = require('../controllers/suggestionController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/', suggestionController.createSuggestion);

// Protected routes (logged in users)
router.use(authController.protect);
router.get('/my-suggestions', suggestionController.getUserSuggestions);

// Admin only routes
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(suggestionController.getAllSuggestions);

router
  .route('/:id')
  .get(suggestionController.getSuggestion)
  .patch(suggestionController.updateSuggestionStatus)
  .delete(suggestionController.deleteSuggestion);

module.exports = router; 