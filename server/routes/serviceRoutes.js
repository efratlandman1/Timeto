const express = require('express');
const {
  getAllServices,
  getServicesByCategory,
  createService
} = require('../controllers/serviceController');

const router = express.Router();

// כל השירותים
router.get('/', getAllServices);

// שירותים לפי קטגוריה
router.get('/byCategory/:categoryId', getServicesByCategory);

// יצירת שירות חדש
router.post('/', createService);

module.exports = router;
