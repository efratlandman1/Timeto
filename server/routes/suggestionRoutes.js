const express = require('express');

const suggestionController = require("../controllers/suggestionController");
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateSuggestion, validateMongoIdParam } = require('../middlewares/inputValidation');

const router = express.Router();

router.post('/', requireAuth, writeLimiter, sanitizeRequest, validateSuggestion, suggestionController.createSuggestion);

router.get('/my-suggestions', requireAuth, generalLimiter, sanitizeRequest, suggestionController.getUserSuggestions);

router.route('/admin')
    .get(requireAdmin, generalLimiter, sanitizeRequest, suggestionController.getAllSuggestions);

router.route('/admin/:id')
    .get(requireAdmin, generalLimiter, sanitizeRequest, validateMongoIdParam('id', 'Suggestion ID'), suggestionController.getSuggestion)
    .patch(requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Suggestion ID'), suggestionController.updateSuggestionStatus)
    .delete(requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Suggestion ID'), suggestionController.deleteSuggestion);

module.exports = router; 