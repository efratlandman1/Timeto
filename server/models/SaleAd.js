const mongoose = require('mongoose');

const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];

const saleAdSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale_categories' },
    price: { type: Number },
    currency: { type: String, enum: CURRENCIES, default: 'ILS' },
    phone: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    images: [{ type: String }],
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Indexes for search & geo
saleAdSchema.index({ title: 'text', description: 'text', city: 'text' });
saleAdSchema.index({ location: '2dsphere' });
saleAdSchema.index({ categoryId: 1, active: 1, createdAt: -1 });
saleAdSchema.index({ price: 1, active: 1 });

const SaleAd = mongoose.model('sale_ads', saleAdSchema);

module.exports = SaleAd;


