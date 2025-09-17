const mongoose = require('mongoose');

const saleFavoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    saleAdId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale_ads', required: true },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

saleFavoriteSchema.index({ userId: 1, saleAdId: 1 }, { unique: true });
saleFavoriteSchema.index({ userId: 1, createdAt: -1 });

const SaleFavorite = mongoose.model('sale_favorites', saleFavoriteSchema);

module.exports = SaleFavorite;


