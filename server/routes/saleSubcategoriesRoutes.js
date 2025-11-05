const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { sanitizeRequest } = require('../middlewares/inputValidation');
const controller = require('../controllers/saleSubcategoriesController');

// List
router.get('/', optionalAuth, sanitizeRequest, controller.getAll);
router.get('/category/:categoryId', optionalAuth, sanitizeRequest, controller.getByCategory);

// Manage (protect as needed)
router.post('/', requireAuth, sanitizeRequest, controller.create);
router.put('/:id', requireAuth, sanitizeRequest, controller.update);
router.delete('/:id', requireAuth, sanitizeRequest, controller.remove);

module.exports = router;


