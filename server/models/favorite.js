const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: "businesses", required: true },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("favorites", favoriteSchema); 