const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for faster resolution by name/category/active
ServiceSchema.index({ name: 1 });
ServiceSchema.index({ categoryId: 1, active: 1, name: 1 });

module.exports = mongoose.model('services', ServiceSchema);
