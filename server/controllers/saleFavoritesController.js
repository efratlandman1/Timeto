const SaleFavorite = require('../models/SaleFavorite');
const mongoose = require('mongoose');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');
const { SALE_FAVORITES_MESSAGES } = require('../messages');

exports.toggleFavorite = async (req, res) => {
    const logSource = 'saleFavoritesController.toggleFavorite';
    const meta = getRequestMeta(req, logSource);
    try {
        const { saleAdId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(saleAdId)) {
            return errorResponse({ res, req, status: 400, message: SALE_FAVORITES_MESSAGES.INVALID_ID, logSource });
        }
        let fav = await SaleFavorite.findOne({ userId: req.user._id, saleAdId });
        if (fav) {
            fav.active = !fav.active;
            await fav.save();
        } else {
            fav = new SaleFavorite({ userId: req.user._id, saleAdId, active: true });
            await fav.save();
        }
        return successResponse({ res, req, data: { active: fav.active }, message: fav.active ? SALE_FAVORITES_MESSAGES.ADDED : SALE_FAVORITES_MESSAGES.REMOVED, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_FAVORITES_MESSAGES.ERROR_TOGGLE, logSource });
    }
};

exports.getUserFavorites = async (req, res) => {
    const logSource = 'saleFavoritesController.getUserFavorites';
    const meta = getRequestMeta(req, logSource);
    try {
        const favorites = await SaleFavorite.find({ userId: req.user._id, active: true })
            .populate({ path: 'saleAdId' })
            .sort({ createdAt: -1 });
        return successResponse({ res, req, data: { favorites }, message: SALE_FAVORITES_MESSAGES.FETCH_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_FAVORITES_MESSAGES.ERROR_FETCH, logSource });
    }
};


