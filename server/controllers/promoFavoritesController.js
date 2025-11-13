const PromoFavorite = require('../models/PromoFavorite');
const mongoose = require('mongoose');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');

exports.toggleFavorite = async (req, res) => {
    const logSource = 'promoFavoritesController.toggleFavorite';
    const meta = getRequestMeta(req, logSource);
    try {
        const { promoAdId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(promoAdId)) {
            return errorResponse({ res, req, status: 400, message: 'Invalid promo ad id', logSource });
        }
        let fav = await PromoFavorite.findOne({ userId: req.user._id, promoAdId });
        if (fav) {
            fav.active = !fav.active;
            await fav.save();
        } else {
            fav = new PromoFavorite({ userId: req.user._id, promoAdId, active: true });
            await fav.save();
        }
        return successResponse({ res, req, data: { active: fav.active }, message: 'Favorite toggled', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'Error toggling favorite', logSource });
    }
};

exports.getUserFavorites = async (req, res) => {
    const logSource = 'promoFavoritesController.getUserFavorites';
    const meta = getRequestMeta(req, logSource);
    try {
        const now = new Date();
        // Only favorites that point to active and in-date promo ads
        let favorites = await PromoFavorite.find({ userId: req.user._id, active: true })
            .populate({ path: 'promoAdId', match: { active: true, validFrom: { $lte: now }, validTo: { $gte: now } } })
            .sort({ createdAt: -1 });
        favorites = favorites.filter(f => f.promoAdId);
        return successResponse({ res, req, data: { favorites }, message: 'Fetched favorites', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'Error fetching favorites', logSource });
    }
};


