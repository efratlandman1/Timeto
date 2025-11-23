const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String, required: true },
    color: { type: String, required: false }
}, {
    timestamps: true
});

// Indexes to speed up lookups by name (used in search resolution)
CategorySchema.index({ name: 1 });

module.exports = mongoose.model('categories', CategorySchema);
