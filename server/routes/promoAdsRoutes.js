const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateMongoIdParam } = require('../middlewares/inputValidation');
const { fileUploadSecurity } = require('../middlewares/fileUploadSecurity');
const controller = require('../controllers/promoAdsController');

router.get('/', optionalAuth, sanitizeRequest, controller.getPromoAds);
router.post('/', requireAuth, writeLimiter, sanitizeRequest, upload.single('image'), fileUploadSecurity, controller.createPromoAd);
router.get('/my', requireAuth, generalLimiter, sanitizeRequest, controller.getUserPromoAds);
router.get('/:id', optionalAuth, generalLimiter, sanitizeRequest, validateMongoIdParam('id', 'Promo Ad ID'), controller.getPromoAdById);
router.put('/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Promo Ad ID'), upload.single('image'), fileUploadSecurity, controller.updatePromoAd);
router.delete('/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Promo Ad ID'), controller.deletePromoAd);
router.patch('/restore/:id', requireAuth, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Promo Ad ID'), controller.restorePromoAd);

module.exports = router;


