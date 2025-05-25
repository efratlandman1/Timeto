const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: "businesses", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("feedbacks", feedbackSchema);
