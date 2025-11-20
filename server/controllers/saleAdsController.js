const SaleAd = require('../models/SaleAd');
const SaleCategory = require('../models/SaleCategory');
const SaleSubcategory = require('../models/SaleSubcategory');
const SaleFavorite = require('../models/SaleFavorite');
const mongoose = require('mongoose');
const mapsUtils = require('../utils/mapsUtils');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');
const { SALE_AD_MESSAGES } = require('../messages');

const DEFAULT_LIMIT = 20;
const MAX_IMAGES = 10;

const escapeRegExp = (str) => (typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

const buildSaleSearchQuery = async (q, categoryId, minPrice, maxPrice) => {
    const query = { active: true };
    // IMPORTANT: Do NOT add $text here. We use Atlas Search ($search) in the aggregation
    // path when q is provided. Adding $text here and then using $match later causes
    // " $match with $text is only allowed as the first pipeline stage ".
    // We keep only ID filters and numeric ranges in this helper.
    if (q) {
        // Optionally resolve category/subcategory names into IDs to narrow results
        const safe = escapeRegExp(q);
        const catDocs = await SaleCategory.find({ name: new RegExp(safe, 'i') }).select('_id');
        const subDocs = await SaleSubcategory.find({ name: new RegExp(safe, 'i') }).select('_id');
        const catIds = catDocs.map(d => d._id);
        const subIds = subDocs.map(d => d._id);
        if (catIds.length) query.categoryId = { ...(query.categoryId || {}), $in: catIds };
        if (subIds.length) query.subcategoryId = { ...(query.subcategoryId || {}), $in: subIds };
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }
    return query;
};

const buildGeoPipeline = (coordinates, query, sort, skip, limitNum) => {
    const geoNearStage = {
        $geoNear: {
            near: { type: 'Point', coordinates },
            distanceField: 'distance',
            spherical: true,
            query
        }
    };
    const sortStage = { $sort: sort === 'distance' ? { distance: 1 } : { createdAt: -1 } };
    const projectStage = {
        $project: {
            title: 1,
            description: 1,
            price: 1,
            currency: 1,
            images: 1,
            city: 1,
            address: 1,
            phone: 1,
            prefix: 1,
            hasWhatsapp: 1,
            categoryId: 1,
            userId: 1,
            active: 1,
            createdAt: 1,
            updatedAt: 1,
            location: 1,
            distance: 1
        }
    };
    return [geoNearStage, sortStage, projectStage, { $skip: skip }, { $limit: limitNum }];
};

exports.createSaleAd = async (req, res) => {
    const logSource = 'saleAdsController.createSaleAd';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta }, `${logSource} enter`);

        const {
            title,
            description = '',
            categoryId,
            subcategoryId,
            subcategoryIds,
            price,
            currency = 'ILS',
            prefix,
            phone,
            hasWhatsapp,
            city,
            address
        } = req.body;

        const normalizedHasWhatsapp = typeof hasWhatsapp === 'string' ? hasWhatsapp === 'true' : (hasWhatsapp ?? true);

        const addressToGeocode = address || city;
        const location = await mapsUtils.geocode(addressToGeocode, req);
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return errorResponse({ res, req, status: 400, message: SALE_AD_MESSAGES.INVALID_COORDINATES, logSource });
        }

        const images = (req.files || []).slice(0, MAX_IMAGES).map(f => f.filename);

        // Denormalize names
        let categoryName;
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            try {
                const cat = await SaleCategory.findById(categoryId).select('name').lean();
                categoryName = cat ? cat.name : undefined;
            } catch (_) {}
        }
        let subIds = [];
        if (subcategoryIds) {
            subIds = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
        } else if (subcategoryId) {
            subIds = [subcategoryId];
        }
        subIds = subIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        let subcategoryNames = [];
        if (subIds.length) {
            try {
                const subs = await SaleSubcategory.find({ _id: { $in: subIds } }).select('name').lean();
                subcategoryNames = subs.map(s => s.name).filter(Boolean);
            } catch (_) {}
        }

        const doc = new SaleAd({
            userId: req.user._id,
            title,
            description,
            categoryId: categoryId && mongoose.Types.ObjectId.isValid(categoryId) ? categoryId : undefined,
            subcategoryId: subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId) ? subcategoryId : undefined,
            subcategoryIds: subIds.length ? subIds : undefined,
            categoryName,
            subcategoryNames,
            price: price !== undefined ? Number(price) : undefined,
            currency,
            prefix,
            phone,
            hasWhatsapp: normalizedHasWhatsapp,
            city,
            address: address || '',
            location: { type: 'Point', coordinates: [location.lng, location.lat] },
            images
        });

        const saved = await doc.save();
        logger.info({ ...meta, adId: saved._id }, `${logSource} complete`);
        return successResponse({ res, req, status: 201, data: { ad: saved }, message: SALE_AD_MESSAGES.CREATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.CREATE_ERROR, logSource });
    }
};

exports.updateSaleAd = async (req, res) => {
    const logSource = 'saleAdsController.updateSaleAd';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta, adId: req.params.id }, `${logSource} enter`);
        const ad = await SaleAd.findById(req.params.id);
        if (!ad) {
            return errorResponse({ res, req, status: 404, message: SALE_AD_MESSAGES.NOT_FOUND, logSource });
        }
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: SALE_AD_MESSAGES.UNAUTHORIZED_EDIT, logSource });
        }

        const {
            title,
            description,
            categoryId,
            subcategoryIds,
            price,
            currency,
            phone,
            city,
            address,
            removeImages
        } = req.body;

        if (title) ad.title = title;
        if (description !== undefined) ad.description = description;
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            ad.categoryId = categoryId;
            try {
                const cat = await SaleCategory.findById(categoryId).select('name').lean();
                ad.categoryName = cat ? cat.name : undefined;
            } catch (_) { ad.categoryName = undefined; }
        }
        if (price !== undefined) ad.price = Number(price);
        if (currency) ad.currency = currency;
        if (phone) ad.phone = phone;
        if (req.body.prefix !== undefined) ad.prefix = req.body.prefix;
        if (req.body.hasWhatsapp !== undefined) ad.hasWhatsapp = typeof req.body.hasWhatsapp === 'string' ? req.body.hasWhatsapp === 'true' : !!req.body.hasWhatsapp;
        if (city) ad.city = city;
        if (address !== undefined) ad.address = address;
        // subcategories: accept both single and array, store denormalized names
        if (subcategoryIds || req.body.subcategoryId) {
            let subIdsUpdate = [];
            if (subcategoryIds) {
                subIdsUpdate = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
            } else if (req.body.subcategoryId) {
                subIdsUpdate = [req.body.subcategoryId];
            }
            subIdsUpdate = subIdsUpdate.filter(id => mongoose.Types.ObjectId.isValid(id));
            ad.subcategoryIds = subIdsUpdate;
            try {
                if (subIdsUpdate.length) {
                    const subs = await SaleSubcategory.find({ _id: { $in: subIdsUpdate } }).select('name').lean();
                    ad.subcategoryNames = subs.map(s => s.name).filter(Boolean);
                } else {
                    ad.subcategoryNames = [];
                }
            } catch (_) { ad.subcategoryNames = []; }
        }

        if ((address && address !== ad.address) || (city && !address)) {
            const addressToGeocode = address || city;
            const location = await mapsUtils.geocode(addressToGeocode, req);
            if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
                ad.location = { type: 'Point', coordinates: [location.lng, location.lat] };
            }
        }

        // handle images
        const newImages = (req.files || []).map(f => f.filename);
        if (removeImages) {
            const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
            ad.images = ad.images.filter(img => !toRemove.includes(img));
        }
        if (newImages.length) {
            ad.images = [...ad.images, ...newImages].slice(0, MAX_IMAGES);
        }

        await ad.save();
        logger.info({ ...meta, adId: ad._id }, `${logSource} complete`);
        return successResponse({ res, req, data: { ad }, message: SALE_AD_MESSAGES.UPDATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.UPDATE_ERROR, logSource });
    }
};

exports.getSaleAds = async (req, res) => {
    const logSource = 'saleAdsController.getSaleAds';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta, query: req.query }, `${logSource} enter`);
        const { q, categoryId, subcategoryId, minPrice, maxPrice, includeNoPrice, lat, lng, maxDistance, sort = 'newest', page = 1, limit = DEFAULT_LIMIT, city } = req.query;
        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || DEFAULT_LIMIT, 40);
        const skip = (pageNum - 1) * limitNum;

        const query = await buildSaleSearchQuery(q, categoryId, minPrice, maxPrice);
        // Exact, non-regex city filter as requested (case-insensitive via collation on .find path)
        if (city) {
            query.city = String(city);
        }
        if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
            query.$or = [
                { subcategoryId: new mongoose.Types.ObjectId(subcategoryId) },
                { subcategoryIds: new mongoose.Types.ObjectId(subcategoryId) }
            ];
        }
        // Enforce only items with price unless explicitly allowed
        const allowNoPrice = includeNoPrice === 'true' || includeNoPrice === true;
        if (!allowNoPrice) {
            query.price = query.price || {};
            query.price.$exists = true;
        }

        let data, total;
        const hasGeo = lat && lng && (sort === 'distance' || maxDistance);
        if (hasGeo) {
            const coordinates = [parseFloat(lng), parseFloat(lat)];
            const pipeline = buildGeoPipeline(coordinates, query, sort, skip, limitNum);
            [data, total] = await Promise.all([
                SaleAd.aggregate(pipeline),
                SaleAd.countDocuments(query)
            ]);
        } else {
            if (q) {
                const sortStage = (() => {
                    if (sort === 'price_asc') return { $sort: { price: 1 } };
                    if (sort === 'price_desc') return { $sort: { price: -1 } };
                    if (sort === 'newest') return { $sort: { createdAt: -1 } };
                    return { $sort: { score: { $meta: 'searchScore' } } };
                })();
                const agg = await SaleAd.aggregate([
                    (function buildSearchStage() {
                        const raw = String(q || '').trim();
                        const tokens = raw.split(/[^0-9\p{L}]+/u).filter(Boolean);
                        return {
                            $search: {
                                index: 'default',
                                compound: {
                                    must: (tokens.length ? tokens : [raw]).map(tok => ({
                                        text: { query: tok, path: ['title', 'description', 'city', 'categoryName', 'subcategoryNames'] }
                                    }))
                                }
                            }
                        };
                    })(),
                    // IMPORTANT: remove any accidental $text before $match (see error 17313)
                    (function cleanMatch() {
                        const nq = { ...query };
                        if (nq.$text) delete nq.$text;
                        return { $match: nq };
                    })(),
                    sortStage,
                    {
                        $facet: {
                            data: [{ $skip: skip }, { $limit: limitNum }],
                            total: [{ $count: 'count' }]
                        }
                    }
                ]);
                const bucket = Array.isArray(agg) && agg[0] ? agg[0] : { data: [], total: [] };
                data = bucket.data || [];
                total = (bucket.total && bucket.total[0] && bucket.total[0].count) ? bucket.total[0].count : 0;
            } else {
                const sortOption = {
                    newest: { createdAt: -1 },
                    price_asc: { price: 1 },
                    price_desc: { price: -1 }
                }[sort] || { createdAt: -1 };
                [data, total] = await Promise.all([
                    SaleAd.find(query).collation({ locale: 'he', strength: 1 }).sort(sortOption).skip(skip).limit(limitNum).lean(),
                    SaleAd.countDocuments(query)
                ]);
            }
        }

        // favorites flag if logged in
        let items = data;
        if (req.user) {
            const adIds = data.map(d => d._id);
            const favs = await SaleFavorite.find({ userId: req.user._id, saleAdId: { $in: adIds }, active: true }).select('saleAdId');
            const mapFav = new Set(favs.map(f => String(f.saleAdId)));
            items = data.map(d => ({ ...d, isFavorite: mapFav.has(String(d._id)) }));
        } else {
            items = data.map(d => ({ ...d, isFavorite: false }));
        }

        const pagination = {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasMore: pageNum < Math.ceil(total / limitNum)
        };

        logger.info({ ...meta, returned: items.length, total }, `${logSource} complete`);
        return successResponse({ res, req, data: { ads: items, pagination }, message: SALE_AD_MESSAGES.GET_ALL_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.GET_ALL_ERROR, logSource });
    }
};

exports.getSaleAdById = async (req, res) => {
    const logSource = 'saleAdsController.getSaleAdById';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta, adId: req.params.id }, `${logSource} enter`);
        const ad = await SaleAd.findById(req.params.id).populate('categoryId', 'name');
        if (!ad) {
            return errorResponse({ res, req, status: 404, message: SALE_AD_MESSAGES.NOT_FOUND, logSource });
        }
        let isFavorite = false;
        if (req.user) {
            const fav = await SaleFavorite.findOne({ userId: req.user._id, saleAdId: ad._id, active: true });
            isFavorite = !!fav;
        }
        logger.info({ ...meta, adId: ad._id }, `${logSource} complete`);
        return successResponse({ res, req, data: { ad: { ...ad.toObject(), isFavorite } }, message: SALE_AD_MESSAGES.GET_BY_ID_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.GET_BY_ID_ERROR, logSource });
    }
};

exports.getUserSaleAds = async (req, res) => {
    const logSource = 'saleAdsController.getUserSaleAds';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta }, `${logSource} enter`);
        const ads = await SaleAd.find({ userId: req.user._id }).sort({ active: -1, createdAt: -1 });
        return successResponse({ res, req, data: { ads }, message: SALE_AD_MESSAGES.GET_ALL_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.GET_ALL_ERROR, logSource });
    }
};

exports.deleteSaleAd = async (req, res) => {
    const logSource = 'saleAdsController.deleteSaleAd';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta, adId: req.params.id }, `${logSource} enter`);
        const ad = await SaleAd.findById(req.params.id);
        if (!ad) {
            return errorResponse({ res, req, status: 404, message: SALE_AD_MESSAGES.NOT_FOUND, logSource });
        }
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: SALE_AD_MESSAGES.UNAUTHORIZED_DELETE, logSource });
        }
        ad.active = false;
        await ad.save();
        return successResponse({ res, req, data: null, message: SALE_AD_MESSAGES.DELETE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.DELETE_ERROR, logSource });
    }
};

exports.restoreSaleAd = async (req, res) => {
    const logSource = 'saleAdsController.restoreSaleAd';
    const meta = getRequestMeta(req, logSource);
    try {
        logger.info({ ...meta, adId: req.params.id }, `${logSource} enter`);
        const ad = await SaleAd.findById(req.params.id);
        if (!ad) {
            return errorResponse({ res, req, status: 404, message: SALE_AD_MESSAGES.NOT_FOUND, logSource });
        }
        if (String(ad.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return errorResponse({ res, req, status: 403, message: SALE_AD_MESSAGES.UNAUTHORIZED_RESTORE, logSource });
        }
        ad.active = true;
        await ad.save();
        return successResponse({ res, req, data: { ad }, message: SALE_AD_MESSAGES.RESTORE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_AD_MESSAGES.RESTORE_ERROR, logSource });
    }
};


