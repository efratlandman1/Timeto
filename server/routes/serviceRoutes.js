const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const adminAuth = require('../middlewares/adminAuth'); // Import the admin middleware

// כל השירותים
router.get('/', getAllServices);

// שירותים לפי קטגוריה
router.get('/byCategory/:categoryId', getServicesByCategory);

// יצירת שירות חדש
router.post('/', adminAuth, createService);

// New CRUD routes
router.put('/:id', adminAuth, updateService);
router.delete('/:id', adminAuth, deleteService);

module.exports = router;
