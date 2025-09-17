const mongoose = require('mongoose');

const saleCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String },
    color: { type: String },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes
saleCategorySchema.index({ active: 1, sortOrder: 1, name: 1 });
saleCategorySchema.index({ name: 'text' });

const SaleCategory = mongoose.model('sale_categories', saleCategorySchema);

module.exports = SaleCategory;


