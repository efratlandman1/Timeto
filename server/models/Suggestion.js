const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['category', 'service'],
  },
  name_he: {
    type: String,
    required: [true, 'Hebrew name is required'],
    trim: true
  },
  name_en: {
    type: String,
    required: [true, 'English name is required'],
    trim: true
  },
  parent_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: function() {
      return this.type === 'service';
    }
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('suggestions', SuggestionSchema); 