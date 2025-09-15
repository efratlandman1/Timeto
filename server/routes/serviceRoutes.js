const express = require('express');
const router = express.Router();
const { getAllServices, createService, getServicesByCategory, updateService, deleteService } = require('../controllers/serviceController');
const { requireAdmin, publicRoute } = require('../middlewares/authMiddleware');
const { sanitizeRequest, validateService, validateMongoIdParam } = require('../middlewares/inputValidation');
const { generalLimiter, writeLimiter } = require('../middlewares/rateLimiter');

router.get('/', publicRoute, generalLimiter, sanitizeRequest, getAllServices);
router.post('/', requireAdmin, writeLimiter, sanitizeRequest, validateService, createService);
router.get('/byCategory/:categoryId', publicRoute, generalLimiter, sanitizeRequest, validateMongoIdParam('categoryId', 'Category ID'), getServicesByCategory);
router.put('/:id', requireAdmin, writeLimiter, sanitizeRequest, validateService, updateService);
router.delete('/:id', requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Service ID'), deleteService);

module.exports = router;
