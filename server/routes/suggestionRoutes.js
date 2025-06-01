const express = require('express');

const suggestionController = require("../controllers/suggestionController");

const router = express.Router();

router.post('/', suggestionController.createSuggestion);

router.get('/my-suggestions', suggestionController.getUserSuggestions);

router
  .route('/')
  .get(suggestionController.getAllSuggestions);

router
  .route('/:id')
  .get(suggestionController.getSuggestion)
  .patch(suggestionController.updateSuggestionStatus)
  .delete(suggestionController.deleteSuggestion);

module.exports = router; 