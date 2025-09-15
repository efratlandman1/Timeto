const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName:  { type: String},
  email:     { type: String, required: true, unique: true },
  phonePrefix: { type: String },
  phone:     { type: String },
  nickname:  { type: String },
  password:  { type: String, required: function() {
    // A password is required only if the user is 'local' and verified.
    return this.authProvider === 'local' && this.is_verified;
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

// Virtual field for full phone number
usersSchema.virtual('fullPhone').get(function() {
  if (this.phonePrefix && this.phone) {
    return `${this.phonePrefix}${this.phone}`;
  }
  return null;
});

module.exports = mongoose.model('users', usersSchema); 