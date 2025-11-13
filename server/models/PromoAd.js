const mongoose = require('mongoose');

const promoAdSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
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
    image: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Virtual computed active by validity (for dynamic checks at query time you can compute client-side too)
promoAdSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    return this.active && now >= this.validFrom && now <= this.validTo;
});

// Indexes
promoAdSchema.index({ title: 'text', city: 'text' });
promoAdSchema.index({ categoryId: 1, active: 1 });
promoAdSchema.index({ location: '2dsphere' });
promoAdSchema.index({ validFrom: 1, validTo: 1, active: 1 });

// Bind explicit collection name to avoid pluralization mismatch
const PromoAd = mongoose.model('PromoAd', promoAdSchema, 'promo_ads');

module.exports = PromoAd;


