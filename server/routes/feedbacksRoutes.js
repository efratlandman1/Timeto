// routes/feedbacks.js
const express = require("express");
const router = express.Router();
const feedbacksController = require("../controllers/feedbacksController");

router.post("/", feedbacksController.createFeedback);
router.delete("/:id", feedbacksController.deleteFeedback);
router.get("/business/:businessId", feedbacksController.getFeedbacksForBusiness);

module.exports = router;
