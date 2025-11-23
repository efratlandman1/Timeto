const mongoose = require('mongoose');

const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];

const saleAdSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale_categories' },
    // keep legacy single subcategoryId for backward compatibility
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale_subcategories' },
    // new: allow multiple subcategories
    subcategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'sale_subcategories' }],
    // denormalized names for Atlas Search
    categoryName: { type: String, trim: true },
    subcategoryNames: [{ type: String, trim: true }],
    price: { type: Number, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'ILS' },
    prefix: { type: String },
    phone: { type: String, required: true },
    hasWhatsapp: { type: Boolean, default: true },
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
saleAdSchema.index({ title: 'text', description: 'text', city: 'text', categoryName: 'text', subcategoryNames: 'text' });
saleAdSchema.index({ location: '2dsphere' });
saleAdSchema.index({ categoryId: 1, active: 1, createdAt: -1 });
saleAdSchema.index({ subcategoryId: 1, active: 1, createdAt: -1 });
saleAdSchema.index({ subcategoryIds: 1, active: 1, createdAt: -1 });
saleAdSchema.index({ price: 1, active: 1 });

// Basic validation for coordinates range
saleAdSchema.pre('validate', function(next) {
    try {
        const coords = this.location?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            const [lng, lat] = coords;
            const ok = typeof lat === 'number' && typeof lng === 'number' && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            if (!ok) return next(new Error('Invalid location coordinates'));
        }
    } catch (_) {}
    next();
});

const SaleAd = mongoose.model('sale_ads', saleAdSchema);

module.exports = SaleAd;


