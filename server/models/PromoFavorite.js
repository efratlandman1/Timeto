const mongoose = require('mongoose');

const promoFavoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    promoAdId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoAd', required: true },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

promoFavoriteSchema.index({ userId: 1, promoAdId: 1 }, { unique: true });
promoFavoriteSchema.index({ userId: 1, createdAt: -1 });

const PromoFavorite = mongoose.model('PromoFavorite', promoFavoriteSchema, 'promo_favorites');

module.exports = PromoFavorite;


