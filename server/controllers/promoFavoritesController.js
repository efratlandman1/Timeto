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
        const favorites = await PromoFavorite.find({ userId: req.user._id, active: true })
            .populate({ path: 'promoAdId' })
            .sort({ createdAt: -1 });
        return successResponse({ res, req, data: { favorites }, message: 'Fetched favorites', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'Error fetching favorites', logSource });
    }
};


