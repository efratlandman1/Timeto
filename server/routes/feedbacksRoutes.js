// routes/feedbacks.js
const express = require("express");
const router = express.Router();
const feedbacksController = require("../controllers/feedbacksController");
const { requireAuth, publicRoute } = require('../middlewares/authMiddleware');

router.post("/", requireAuth, feedbacksController.createFeedback);
router.delete("/:id", requireAuth, feedbacksController.deleteFeedback);
router.get("/business/:businessId", publicRoute, feedbacksController.getFeedbacksForBusiness);

module.exports = router;
