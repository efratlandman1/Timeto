const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true },
    logo: { type: String },
    // heroImage: { type: String, required: true },
    description: String,
    // categoryId: String,
    // subCategoryIds: [String],
    // // active: { type: Boolean, required: true },
    // userId: String
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'service' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }
});

const Business = mongoose.model('businesses', businessSchema);

module.exports = Business;
