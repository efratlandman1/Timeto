const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    prefix: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    logo: { type: String },
    rating: { type: Number },
    // heroImage: { type: String, required: true },
    description: String,
    // categoryId: String,
    // subCategoryIds: [String],
    // // active: { type: Boolean, required: true },
    // userId: String
    active: {  type: Boolean,  default: true},
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'services' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    openingHours: [
    {
      day: { type: Number, required: true },
      closed: { type: Boolean, default: false },
      ranges: [
        {
          open: String,
          close: String,
        }
      ]
    }
  ]
});

const Business = mongoose.model('businesses', businessSchema);

module.exports = Business;
