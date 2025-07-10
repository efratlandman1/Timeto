const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: "businesses", required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// אינדקסים לביצועים טובים יותר
favoriteSchema.index({ user_id: 1, active: 1 }); // לשליפת מועדפים של משתמש
favoriteSchema.index({ user_id: 1, business_id: 1 }, { unique: true }); // למניעת כפילויות
favoriteSchema.index({ business_id: 1, active: 1 }); // לסטטיסטיקות עסקים

module.exports = mongoose.model("favorites", favoriteSchema); 