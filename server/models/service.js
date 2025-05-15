const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('services', ServiceSchema);
