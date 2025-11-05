const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    enum: ['business', 'sale'],
    default: 'business'
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['category', 'service', 'subcategory'],
  },
  name_he: {
    type: String,
    required: [true, 'Hebrew name is required'],
    trim: true
  },
  name_en: {
    type: String,
    required: false,
    trim: true
  },
  parent_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: function() {
      return this.type === 'service';
    }
  },
  sale_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sale_categories',
    required: function() {
      return this.domain === 'sale' && this.type === 'subcategory';
    }
  },
  sale_subcategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sale_subcategories',
    required: false
  },
  reason: {
    type: String,
    trim: true
  },
  notifyEmail: {
    type: String,
    trim: true
  },
  notifyPhone: {
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