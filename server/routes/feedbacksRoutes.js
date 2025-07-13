// routes/feedbacks.js
const express = require("express");
const router = express.Router();
const feedbacksController = require("../controllers/feedbacksController");
const { requireAuth, publicRoute } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

router.post("/", requireAuth, writeLimiter, feedbacksController.createFeedback);
router.delete("/:id", requireAuth, writeLimiter, feedbacksController.deleteFeedback);
router.get("/business/:businessId", publicRoute, generalLimiter, feedbacksController.getFeedbacksForBusiness);

module.exports = router;
