const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: String,
    description: String,
    userId: String,
    photoPath: String,
    address: { type: String, required: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true },
    logo: { type: String, required: true },
    heroImage: { type: String, required: true },
    subCategoryIds: [String],
    active: { type: Boolean, required: true }
});

const Business = mongoose.model('businesses', businessSchema);

module.exports = Business;
