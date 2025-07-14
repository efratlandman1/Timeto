// routes/feedbacks.js
const express = require("express");
const router = express.Router();
const feedbacksController = require("../controllers/feedbacksController");
const { requireAuth, publicRoute } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateFeedback, validateMongoIdParam } = require('../middlewares/inputValidation');

router.post("/", requireAuth, writeLimiter, sanitizeRequest, validateFeedback, feedbacksController.createFeedback);
router.delete("/:id", requireAuth, writeLimiter, feedbacksController.deleteFeedback);
router.get("/business/:businessId", publicRoute, generalLimiter, sanitizeRequest, validateMongoIdParam('businessId', 'Business ID'), feedbacksController.getFeedbacksForBusiness);

module.exports = router;
