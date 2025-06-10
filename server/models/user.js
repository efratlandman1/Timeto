const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String },
  nickname:  { type: String },
  password:  { type: String, required: function() {
    // סיסמה נדרשת רק אם המשתמש הוא 'מקומי'
    return this.authProvider === 'local';
  }},
  authProvider: {
    type: String,
    enum: ['local', 'google'], // ניתן להוסיף עוד בעתיד
    default: 'local'
  },
  providerId: { type: String, default: null }, // למזהה הייחודי מגוגל
  role: {
    type: String,
    enum: ['admin', 'manager', 'end-user'],
    default: 'end-user'
  },

  // 🆕 שדות אימות
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('users', usersSchema); 