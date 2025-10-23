const express = require('express');
const router = express.Router();
const { requireAdmin, optionalAuth, requireAuth } = require('../middlewares/authMiddleware');
const { generalLimiter, writeLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateMongoIdParam } = require('../middlewares/inputValidation');
const controller = require('../controllers/saleCategoriesController');

router.get('/', optionalAuth, generalLimiter, sanitizeRequest, controller.getAll);
router.post('/', requireAdmin, writeLimiter, sanitizeRequest, controller.create);
router.put('/:id', requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Category ID'), controller.update);
router.delete('/:id', requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Category ID'), controller.delete);

module.exports = router;


