const express = require('express');
const router = express.Router();
const { createDocument, searchDocuments, indexEntity } = require('../controllers/embeddingsController');
const { generalLimiter, writeLimiter } = require('../middlewares/rateLimiter');

// Lightweight input size limits for these endpoints can reuse global body limits

// Index a single document (public or protect as needed)
router.post('/documents', writeLimiter, createDocument);

// Vector search endpoint
router.post('/search', generalLimiter, searchDocuments);

// Index (or re-index) an entity (business/promo/sale) by ID
router.post('/index', writeLimiter, indexEntity);

module.exports = router;


