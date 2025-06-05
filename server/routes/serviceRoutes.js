const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

// כל השירותים
router.get('/', getAllServices);

// שירותים לפי קטגוריה
router.get('/byCategory/:categoryId', getServicesByCategory);

// יצירת שירות חדש
router.post('/', createService);

// New CRUD routes
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;
