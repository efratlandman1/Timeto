// controllers/feedbackController.js
const Feedback = require("../models/feedback");
const AuthUtils = require('../utils/authUtils');
const mongoose = require('mongoose');

exports.createFeedback = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    console.log('token:',token)
    console.log('userId:',userId)
   if (!userId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }

    const { business_id, rating, comment } = req.body;

    const feedback = new Feedback({
    user_id: new mongoose.Types.ObjectId(userId),
    business_id: new mongoose.Types.ObjectId(business_id),
    rating,
    comment,
    created_at: new Date()
    });

    console.log('feedback:',feedback)

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error creating feedback:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "כבר הגשת פידבק לעסק זה" });
    }
    res.status(500).json({ error: 'שגיאה ביצירת הפידבק' });
  }
};


exports.getFeedbacksForBusiness = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ business_id: req.params.businessId })
      .populate("user_id", "nickname")
      .populate("business_id", "name logo")
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
