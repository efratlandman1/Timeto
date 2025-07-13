const express = require('express');

const suggestionController = require("../controllers/suggestionController");
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/', requireAuth, writeLimiter, suggestionController.createSuggestion);

router.get('/my-suggestions', requireAuth, generalLimiter, suggestionController.getUserSuggestions);

router
  .route('/')
  .get(requireAdmin, generalLimiter, suggestionController.getAllSuggestions);

router
  .route('/:id')
  .get(requireAdmin, generalLimiter, suggestionController.getSuggestion)
  .patch(requireAdmin, writeLimiter, suggestionController.updateSuggestionStatus)
  .delete(requireAdmin, writeLimiter, suggestionController.deleteSuggestion);

module.exports = router; 