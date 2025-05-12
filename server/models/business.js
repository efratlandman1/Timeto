const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    // phone: { type: Number, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    logo: { type: String },
    // heroImage: { type: String, required: true },
    description: String,
    // categoryId: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
    subCategoryIds: [String],
    // active: { type: Boolean, required: true },
    // userId: String
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    rating: {type: Number},
    openingHours: [
        {
          day: { type: String, required: true },
          from: { type: String },
          to: { type: String }
        }
      ]
});

const Business = mongoose.model('businesses', businessSchema);

module.exports = Business;
