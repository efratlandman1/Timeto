// controllers/feedbackController.js
const Feedback = require("../models/feedback");
const mongoose = require('mongoose');

exports.createFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { business_id, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(business_id)) {
      return res.status(400).json({ error: "מספר עסק לא תקין." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "אנא בחר דירוג בין 1 ל-5." });
    }

    const feedback = new Feedback({
      user_id: new mongoose.Types.ObjectId(userId),
      business_id: new mongoose.Types.ObjectId(business_id),
      rating,
      comment
    });

    await feedback.save();

    res.status(201).json({ message: "הפידבק נוצר בהצלחה.", feedback });

  } catch (err) {
    console.error('Error creating feedback:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "כבר הגשת פידבק לעסק זה." });
    }
    res.status(500).json({ error: "שגיאה פנימית ביצירת הפידבק." });
  }
};

exports.getFeedbacksForBusiness = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ business_id: req.params.businessId })
      .populate("user_id", "nickname")
      .populate("business_id", "name logo")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const feedbackId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ error: "מזהה הפידבק לא תקין." });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: "הפידבק לא נמצא." });
    }

    if (feedback.user_id.toString() !== userId) {
      return res.status(403).json({ error: "אין לך הרשאה למחוק פידבק זה." });
    }

    await Feedback.deleteOne({ _id: feedbackId });
    res.status(200).json({ message: "הפידבק נמחק בהצלחה." });

  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ error: "שגיאה פנימית במחיקת הפידבק." });
  }
};
