// controllers/feedbackController.js
const Feedback = require("../models/feedback");
const AuthUtils = require('../utils/authUtils');

exports.createFeedback = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    if (!userId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }

    const { business_id, rating, comment } = req.body;

    const feedback = new Feedback({
      user_id: userId,
      business_id,
      rating,
      comment,
      created_at: new Date()
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
};


exports.getFeedbacksForBusiness = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ business_id: req.params.businessId })
      .populate("user_id", "nickname")
      .sort({ created_at: -1 });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteFeedback = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    if (!userId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    if (feedback.user_id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this feedback" });
    }

    await Feedback.deleteOne({ _id: feedbackId });
    res.status(200).json({ message: "Feedback deleted successfully" });

  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
};
