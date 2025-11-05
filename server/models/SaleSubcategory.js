const mongoose = require('mongoose');

const saleSubcategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String },
    color: { type: String },
    saleCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale_categories', required: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes
saleSubcategorySchema.index({ saleCategoryId: 1, active: 1, sortOrder: 1, name: 1 });
saleSubcategorySchema.index({ name: 'text' });

const SaleSubcategory = mongoose.model('sale_subcategories', saleSubcategorySchema);

module.exports = SaleSubcategory;



