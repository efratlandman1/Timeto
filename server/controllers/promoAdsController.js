const PromoAd = require('../models/PromoAd');
const mongoose = require('mongoose');
const PromoFavorite = require('../models/PromoFavorite');
const mapsUtils = require('../utils/mapsUtils');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');
const { PROMO_AD_MESSAGES } = require('../messages');

const DEFAULT_LIMIT = 20;

const buildPromoQuery = (q, status = 'active') => {
    const now = new Date();
    let query;
    switch (status) {
        case 'upcoming':
            query = { active: true, validFrom: { $gt: now } };
            break;
        case 'expired':
            query = { active: true, validTo: { $lt: now } };
            break;
        case 'all':
            query = { active: true };
            break;
        case 'active':
        default:
            query = { active: true, validFrom: { $lte: now }, validTo: { $gte: now } };
            break;
    }
    if (q) query.$text = { $search: q };
    return query;
};

const isWithinValidity = (doc) => {
    const now = new Date();
    return doc.active && now >= doc.validFrom && now <= doc.validTo;
};

exports.createPromoAd = async (req, res) => {
    const logSource = 'promoAdsController.createPromoAd';
    const meta = getRequestMeta(req, logSource);
    try {
        const { title, city, address, validFrom, validTo } = req.body;
        if (!req.file) {
            return errorResponse({ res, req, status: 400, message: PROMO_AD_MESSAGES.IMAGE_REQUIRED, logSource });
        }
        const addressToGeocode = address || city;
        const location = await mapsUtils.geocode(addressToGeocode, req);
        const doc = new PromoAd({
            userId: req.user._id,
            title,
            city,
            address: address || '',
            location: { type: 'Point', coordinates: [location.lng, location.lat] },
            image: req.file.filename,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            active: true
        });
        const saved = await doc.save();
        return successResponse({ res, req, status: 201, data: { ad: saved }, message: PROMO_AD_MESSAGES.CREATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.CREATE_ERROR, logSource });
    }
};

exports.updatePromoAd = async (req, res) => {
    const logSource = 'promoAdsController.updatePromoAd';
    const meta = getRequestMeta(req, logSource);
    try {
        const ad = await PromoAd.findById(req.params.id);
        if (!ad) return errorResponse({ res, req, status: 404, message: PROMO_AD_MESSAGES.NOT_FOUND, logSource });
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: PROMO_AD_MESSAGES.UNAUTHORIZED_EDIT, logSource });
        }
        const { title, city, address, validFrom, validTo, active } = req.body;
        if (title) ad.title = title;
        if (city) ad.city = city;
        if (address !== undefined) ad.address = address;
        if (validFrom) ad.validFrom = new Date(validFrom);
        if (validTo) ad.validTo = new Date(validTo);
        if (typeof active !== 'undefined') ad.active = !!active;
        if ((address && address !== ad.address) || (city && !address)) {
            const addr = address || city;
            const location = await mapsUtils.geocode(addr, req);
            ad.location = { type: 'Point', coordinates: [location.lng, location.lat] };
        }
        if (req.file) ad.image = req.file.filename;
        await ad.save();
        return successResponse({ res, req, data: { ad }, message: PROMO_AD_MESSAGES.UPDATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.UPDATE_ERROR, logSource });
    }
};

exports.getPromoAds = async (req, res) => {
    const logSource = 'promoAdsController.getPromoAds';
    const meta = getRequestMeta(req, logSource);
    try {
        const { q, status = 'active', lat, lng, maxDistance, sort = 'newest', page = 1, limit = DEFAULT_LIMIT } = req.query;
        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || DEFAULT_LIMIT, 40);
        const skip = (pageNum - 1) * limitNum;

        const query = buildPromoQuery(q, status);
        let data, total;
        const hasGeo = lat && lng && (sort === 'distance' || maxDistance);
        if (hasGeo) {
            const coordinates = [parseFloat(lng), parseFloat(lat)];
            const geoNearStage = {
                $geoNear: {
                    near: { type: 'Point', coordinates },
                    distanceField: 'distance',
                    spherical: true,
                    query
                }
            };
            const sortStage = { $sort: sort === 'distance' ? { distance: 1 } : { validFrom: -1 } };
            [data, total] = await Promise.all([
                PromoAd.aggregate([geoNearStage, sortStage, { $skip: skip }, { $limit: limitNum }]),
                PromoAd.countDocuments(query)
            ]);
        } else {
            const sortOption = sort === 'newest' ? { validFrom: -1 } : { createdAt: -1 };
            [data, total] = await Promise.all([
                PromoAd.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
                PromoAd.countDocuments(query)
            ]);
        }

        // compute dynamic status and favorite flag
        let items = data.map(d => ({ ...d, isCurrentlyActive: isWithinValidity(d) }));
        if (req.user) {
            const ids = data.map(d => d._id);
            const favs = await PromoFavorite.find({ userId: req.user._id, promoAdId: { $in: ids }, active: true }).select('promoAdId');
            const setFav = new Set(favs.map(f => String(f.promoAdId)));
            items = items.map(d => ({ ...d, isFavorite: setFav.has(String(d._id)) }));
        } else {
            items = items.map(d => ({ ...d, isFavorite: false }));
        }
        const pagination = {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasMore: pageNum < Math.ceil(total / limitNum)
        };
        return successResponse({ res, req, data: { ads: items, pagination }, message: PROMO_AD_MESSAGES.GET_ALL_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.GET_ALL_ERROR, logSource });
    }
};

exports.getPromoAdById = async (req, res) => {
    const logSource = 'promoAdsController.getPromoAdById';
    const meta = getRequestMeta(req, logSource);
    try {
        const ad = await PromoAd.findById(req.params.id);
        if (!ad) {
            return errorResponse({ res, req, status: 404, message: PROMO_AD_MESSAGES.NOT_FOUND, logSource });
        }
        const isOwnerOrAdmin = req.user && (String(ad.userId) === String(req.user._id) || req.user.role === 'admin');
        const visibleToPublic = ad.active && isWithinValidity(ad);
        if (!visibleToPublic && !isOwnerOrAdmin) {
            return errorResponse({ res, req, status: 404, message: PROMO_AD_MESSAGES.NOT_FOUND, logSource });
        }
        let isFavorite = false;
        if (req.user) {
            const fav = await PromoFavorite.findOne({ userId: req.user._id, promoAdId: ad._id, active: true });
            isFavorite = !!fav;
        }
        return successResponse({ res, req, data: { ad: { ...ad.toObject(), isCurrentlyActive: visibleToPublic, isFavorite } }, message: PROMO_AD_MESSAGES.GET_BY_ID_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.GET_BY_ID_ERROR, logSource });
    }
};

exports.deletePromoAd = async (req, res) => {
    const logSource = 'promoAdsController.deletePromoAd';
    const meta = getRequestMeta(req, logSource);
    try {
        const ad = await PromoAd.findById(req.params.id);
        if (!ad) return errorResponse({ res, req, status: 404, message: PROMO_AD_MESSAGES.NOT_FOUND, logSource });
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: PROMO_AD_MESSAGES.UNAUTHORIZED_DELETE, logSource });
        }
        ad.active = false;
        await ad.save();
        return successResponse({ res, req, data: null, message: PROMO_AD_MESSAGES.DELETE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.DELETE_ERROR, logSource });
    }
};

exports.restorePromoAd = async (req, res) => {
    const logSource = 'promoAdsController.restorePromoAd';
    const meta = getRequestMeta(req, logSource);
    try {
        const ad = await PromoAd.findById(req.params.id);
        if (!ad) return errorResponse({ res, req, status: 404, message: PROMO_AD_MESSAGES.NOT_FOUND, logSource });
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: PROMO_AD_MESSAGES.UNAUTHORIZED_RESTORE, logSource });
        }
        ad.active = true;
        await ad.save();
        return successResponse({ res, req, data: { ad }, message: PROMO_AD_MESSAGES.RESTORE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.RESTORE_ERROR, logSource });
    }
};

exports.getUserPromoAds = async (req, res) => {
    const logSource = 'promoAdsController.getUserPromoAds';
    const meta = getRequestMeta(req, logSource);
    try {
        const ads = await PromoAd.find({ userId: req.user._id }).sort({ active: -1, createdAt: -1 });
        return successResponse({ res, req, data: { ads }, message: PROMO_AD_MESSAGES.GET_ALL_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: PROMO_AD_MESSAGES.GET_ALL_ERROR, logSource });
    }
};

