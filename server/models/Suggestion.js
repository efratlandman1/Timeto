const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
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
  }
   ,
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
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at timestamp before saving
suggestionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('suggestions', suggestionSchema); 