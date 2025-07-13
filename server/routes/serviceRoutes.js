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

// כל השירותים
router.get('/', publicRoute, getAllServices);

// שירותים לפי קטגוריה
router.get('/byCategory/:categoryId', publicRoute, getServicesByCategory);

// יצירת שירות חדש
router.post('/', requireAdmin, createService);

// New CRUD routes
router.put('/:id', requireAdmin, updateService);
router.delete('/:id', requireAdmin, deleteService);

module.exports = router;
