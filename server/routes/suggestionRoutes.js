const express = require('express');

const suggestionController = require("../controllers/suggestionController");
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', requireAuth, suggestionController.createSuggestion);

router.get('/my-suggestions', requireAuth, suggestionController.getUserSuggestions);

router
  .route('/')
  .get(requireAdmin, suggestionController.getAllSuggestions);

router
  .route('/:id')
  .get(requireAdmin, suggestionController.getSuggestion)
  .patch(requireAdmin, suggestionController.updateSuggestionStatus)
  .delete(requireAdmin, suggestionController.deleteSuggestion);

module.exports = router; 