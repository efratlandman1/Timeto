const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: "businesses", required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model("favorites", favoriteSchema); 