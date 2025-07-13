const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { requireAdmin, publicRoute } = require('../middlewares/authMiddleware'); // Import the new admin middleware
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

// כל השירותים
router.get('/', publicRoute, generalLimiter, getAllServices);

// שירותים לפי קטגוריה
router.get('/byCategory/:categoryId', publicRoute, generalLimiter, getServicesByCategory);

// יצירת שירות חדש
router.post('/', requireAdmin, writeLimiter, createService);

// New CRUD routes
router.put('/:id', requireAdmin, writeLimiter, updateService);
router.delete('/:id', requireAdmin, writeLimiter, deleteService);

module.exports = router;
