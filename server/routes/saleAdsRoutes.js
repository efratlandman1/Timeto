const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { requireAuth, publicRoute, requireAdmin, optionalAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateMongoIdParam } = require('../middlewares/inputValidation');
const { fileUploadSecurityArray } = require('../middlewares/fileUploadSecurity');
const controller = require('../controllers/saleAdsController');

// List & search
router.get('/', optionalAuth, sanitizeRequest, controller.getSaleAds);
// Create
router.post('/', requireAuth, writeLimiter, sanitizeRequest, upload.array('images', 10), fileUploadSecurityArray, controller.createSaleAd);
// User ads
router.get('/my', requireAuth, generalLimiter, sanitizeRequest, controller.getUserSaleAds);
// Single
router.get('/:id', optionalAuth, generalLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Ad ID'), controller.getSaleAdById);
router.put('/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Ad ID'), upload.array('images', 10), fileUploadSecurityArray, controller.updateSaleAd);
router.delete('/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Ad ID'), controller.deleteSaleAd);
router.patch('/restore/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Sale Ad ID'), controller.restoreSaleAd);

module.exports = router;


