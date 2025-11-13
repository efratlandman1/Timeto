const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');
const Category = require('../models/category');
const mongoose = require('mongoose');
const Service = require('../models/service');
const Feedback = require('../models/feedback');
const mapsUtils = require('../utils/mapsUtils');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta,serializeError } = require('../utils/errorUtils');
const { BUSINESS_MESSAGES } = require('../messages');

const DEFAULT_ITEMS_PER_PAGE = 8;
const CACHE_TTL = 3600; // זמן חיים של הקאש בשניות (שעה)

/**
 * בונה קוורי חיפוש טקסטואלי
 * @param {string} q - טקסט החיפוש
 * @param {Array} categoryIds - מערך של ID של קטגוריות תואמות
 * @param {Array} serviceIds - מערך של ID של שירותים תואמים
 * @returns {Object} קוורי MongoDB
 */
const buildSearchQuery = async (q) => {
    // חיפוש קטגוריות תואמות
    const matchingCategories = await Category.find({ name: new RegExp(q, 'i') });
    const categoryIds = matchingCategories.map(cat => cat._id);

    // חיפוש שירותים תואמים
    const matchingServices = await Service.find({ name: new RegExp(q, 'i') });
    const serviceIds = matchingServices.map(service => service._id);

    // יצירת ביטוי רגולרי לחיפוש
    const searchRegex = new RegExp(q, 'i');

    return {
        $and: [
            { active: true },
            {
                $or: [
                    // חיפוש טקסטואלי בשדות טקסט חופשי
                    { $text: { $search: q } },
                    // חיפוש מדויק באימייל וטלפון
                    { email: searchRegex },
                    { phone: searchRegex },
                    // חיפוש בקטגוריות ושירותים
                    { categoryId: { $in: categoryIds } },
                    { services: { $in: serviceIds } }
                ]
            }
        ]
    };
};

/**
 * בונה קוורי סינון לפי פרמטרים קבועים
 * @param {string} categoryName - שם הקטגוריה
 * @param {Array|string} services - שירותים לסינון
 * @param {number} rating - דירוג מינימלי
 * @returns {Object} קוורי MongoDB
 */
const buildFilterQuery = async (categoryName, services, rating) => {
    const query = { active: true };

    // קשר בין קטגוריה לשירותים:
    // אם נבחרו גם קטגוריה וגם שירותים, הסינון יתבצע לפי השירותים בלבד (כל עסק שיש לו את השירות המבוקש יעלה, בלי קשר לקטגוריה)
    // אם נבחרה רק קטגוריה, הסינון יתבצע לפי קטגוריה
    // אם נבחרו רק שירותים, הסינון יתבצע לפי שירותים

    let filterByCategory = !!categoryName && !services;

    // טיפול בקטגוריה: שם או אובייקט איי.די
    if (filterByCategory) {
        if (mongoose.Types.ObjectId.isValid(categoryName)) {
            query.categoryId = categoryName;
        } else {
            const category = await Category.findOne({ name: categoryName });
            if (category) {
                query.categoryId = category._id;
            } else {
                query.categoryId = null; // לא יוחזרו תוצאות
            }
        }
    }

    // טיפול בשירותים: שם או אובייקט איי.די
    if (services) {
        let serviceList = Array.isArray(services) ? services : [services];
        const objectIds = serviceList.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (objectIds.length === serviceList.length) {
            // כל השירותים הם ObjectId - סינון OR ביניהם
            query.services = { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) };
        } else {
            const serviceDocs = await Service.find({ name: { $in: serviceList } });
            const ids = serviceDocs.map(s => s._id);
            if (ids.length > 0) {
                // סינון OR בין השירותים שנמצאו
                query.services = { $in: ids };
            } else {
                // לא נמצאו שירותים - לא להחזיר תוצאות
                query.services = { $in: [null] };
            }
        }
    }

    if (rating) {
        query.rating = { $gte: Number(rating) };
    }

    return query;
};

/**
 * בונה פייפליין של geoNear עבור חיפושים מרחביים
 * @param {Array} coordinates - קואורדינטות [lng, lat]
 * @param {Object} query - קוורי בסיסי
 * @param {string} sort - סוג המיון
 * @param {number} maxDistance - מרחק מקסימלי בקילומטרים
 * @returns {Array} פייפליין MongoDB
 */ 
const buildGeoNearPipeline = (coordinates, query, sort, maxDistance) => {
    logger.debug('buildGeoNearPipeline - Input:', { coordinates, sort, maxDistance });
    
    // נבנה את אובייקט ה-geoNear
    const geoNearStage = {
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: coordinates
            },
            distanceField: 'distance',
            spherical: true,
            query
        }
    };

    // נוסיף maxDistance רק אם הוא קיים ותקין
    if (maxDistance !== undefined && maxDistance !== null && maxDistance !== '' && !isNaN(Number(maxDistance))) {
        const maxDistanceMeters = Number(maxDistance) * 1000; // קילומטרים למטרים
        geoNearStage.$geoNear.maxDistance = maxDistanceMeters;
        logger.debug(`Added maxDistance: ${maxDistance} km = ${maxDistanceMeters} meters`);
    } else {
        logger.debug('No valid maxDistance provided');
    }

    logger.debug('Final geoNear stage:', JSON.stringify(geoNearStage, null, 2));

    return [
        geoNearStage,
        { 
            $sort: sort === 'popular_nearby' ? 
                { distance: 1, rating: -1 } : 
                { distance: 1 } 
        }
    ];
};

/**
 * בונה פייפליין של lookup עבור שדות מקושרים
 * @param {number} skip - מספר רשומות לדילוג
 * @param {number} limit - מספר רשומות מקסימלי
 * @returns {Array} פייפליין MongoDB
 */
const buildLookupPipeline = (skip, limit) => {
    return [
        { $skip: skip },
        { $limit: limit },
        { 
            $project: {
                name: 1,
                address: 1,
                phone: 1,
                email: 1,
                logo: 1,
                rating: 1,
                categoryId: 1,
                services: 1,
                userId: 1,
                createdAt: 1,
                updatedAt: 1,
                active: 1,
                location: 1
            }
        },
        { 
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categoryId',
                pipeline: [
                  { $project: { name: 1, color: 1, logo: 1 } }
                ]
            }
        },
        { 
            $unwind: { 
                path: '$categoryId', 
                preserveNullAndEmptyArrays: true 
            }
        },
        { 
            $lookup: {
                from: 'services',
                localField: 'services',
                foreignField: '_id',
                as: 'services'
            }
        }
    ];
};

exports.getAllBusinesses = async (req, res) => {
    const logSource = 'businessesController.getAllBusinesses';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta }, `${logSource} enter`);
        
        const businesses = await Business.find({})
            .populate('categoryId', 'name color logo')
            .populate('services', 'name')
            .populate('userId', 'firstName lastName');

        const businessesWithFeedback = await Promise.all(
            businesses.map(async (business) => {
                const feedbacks = await Feedback.find({ business_id: business._id }).populate({
                    path: 'user_id',
                    select: 'firstName lastName _id'
                });
                return { ...business.toObject(), feedbacks };
            })
        );

        logger.info({ ...meta, count: businessesWithFeedback.length }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { businesses: businessesWithFeedback },
            message: BUSINESS_MESSAGES.GET_ALL_SUCCESS,
            logSource
        });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);        
        Sentry.captureException(err);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.GET_ALL_ERROR,
            logSource
        });
    }
};

exports.uploadBusinesses = async (req, res) => {
    const logSource = 'businessesController.uploadBusinesses';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta }, `${logSource} enter`);
        
        const userId = req.user._id;

        if (req.body.id) {
            return updateBusiness(req, res, userId);
        } else {
            return createBusiness(req, res, userId);
        }
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.UPLOAD_ERROR,
            logSource
        });
    }
};

const createBusiness = async (req, res, userId) => {
    const logSource = 'businessesController.createBusiness';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta }, `${logSource} enter`);
        
        // const openingHours = JSON.parse(req.body.openingHours || '[]');
        // const services = JSON.parse(req.body.services || '[]');
        const openingHours = req.body.openingHours || [];
        const services = req.body.services || [];
        // Get coordinates from address
        const location = await mapsUtils.geocode(req.body.address, req);
        
        // ולידציה נוספת של הקואורדינטות
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            logger.warn({ ...meta, address: req.body.address }, BUSINESS_MESSAGES.INVALID_COORDINATES);
            return errorResponse({
                res,
                req,
                status: 400,
                message: BUSINESS_MESSAGES.INVALID_COORDINATES,
                logSource
            });
        }
        
        logger.info({ 
            ...meta, 
            coordinates: [location.lng, location.lat], 
            address: req.body.address 
        }, `${logSource} creating with coordinates`);
        
        const newBusiness = new Business({
            name: req.body.name,
            email: req.body.email,
            hasWhatsapp: typeof req.body.hasWhatsapp === 'string' ? req.body.hasWhatsapp === 'true' : (req.body.hasWhatsapp ?? true),
            prefix: req.body.prefix,
            phone: req.body.phone,
            categoryId: req.body.categoryId,
            description: req.body.description || '',
            services,
            openingHours,
            userId: userId,
            address: req.body.address,
            logo: req.file?.filename || '',
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            }
        });

        const savedItem = await newBusiness.save();
        
        logger.info({ ...meta, businessId: savedItem._id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            status: 201,
            data: { business: savedItem },
            message: BUSINESS_MESSAGES.CREATE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.CREATE_ERROR,
            logSource
        });
    }
};

const updateBusiness = async (req, res, userId) => {
    const logSource = 'businessesController.updateBusiness';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta, businessId: req.body.id }, `${logSource} enter`);
        
        const existingBusiness = await Business.findById(req.body.id);
        
        if (!existingBusiness) {
            logger.warn({ ...meta, businessId: req.body.id }, BUSINESS_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: BUSINESS_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        // בדיקת הרשאות - רק הבעלים או אדמין יכולים לערוך
        if (String(existingBusiness.userId) !== String(userId) && req.user.role !== 'admin') {
            logger.warn({ ...meta, businessId: req.body.id, userId, ownerId: existingBusiness.userId }, BUSINESS_MESSAGES.UNAUTHORIZED_EDIT);
            return errorResponse({
                res,
                req,
                status: 403,
                message: BUSINESS_MESSAGES.UNAUTHORIZED_EDIT,
                logSource
            });
        }

        // עדכון כתובת וקואורדינטות אם השתנתה
        if (req.body.address && req.body.address !== existingBusiness.address) {
            const location = await mapsUtils.geocode(req.body.address, req);
            
            if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
                logger.warn({ ...meta, address: req.body.address }, BUSINESS_MESSAGES.INVALID_COORDINATES);
                return errorResponse({
                    res,
                    req,
                    status: 400,
                    message: BUSINESS_MESSAGES.INVALID_COORDINATES,
                    logSource
                });
            }
            
            existingBusiness.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        // עדכון שדות אחרים
        existingBusiness.name = req.body.name || existingBusiness.name;
        existingBusiness.email = req.body.email || existingBusiness.email;
        if (req.body.hasWhatsapp !== undefined) {
            existingBusiness.hasWhatsapp = typeof req.body.hasWhatsapp === 'string' 
                ? req.body.hasWhatsapp === 'true' 
                : !!req.body.hasWhatsapp;
        }
        existingBusiness.prefix = req.body.prefix || existingBusiness.prefix;
        existingBusiness.phone = req.body.phone || existingBusiness.phone;
        existingBusiness.categoryId = req.body.categoryId || existingBusiness.categoryId;
        existingBusiness.description = req.body.description || existingBusiness.description;
        existingBusiness.services = typeof req.body.services === 'string' ? JSON.parse(req.body.services) : (req.body.services || existingBusiness.services);
        existingBusiness.address = req.body.address || existingBusiness.address;
        // Normalize to store only filename (same as createBusiness)
        existingBusiness.logo = req.file?.filename || existingBusiness.logo;
        existingBusiness.openingHours = typeof req.body.openingHours === 'string' ? JSON.parse(req.body.openingHours) : (req.body.openingHours || existingBusiness.openingHours);

        await existingBusiness.save();
        
        logger.info({ ...meta, businessId: req.body.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { business: existingBusiness },
            message: BUSINESS_MESSAGES.UPDATE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.UPDATE_ERROR,
            logSource
        });
    }
};

// exports.getItems = async (req, res) => {
//     try {
//         const businesses = await Business.find({});
//         res.status(200).json(businesses);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({message: err.message});
//     }
// };

exports.getUserBusinesses = async (req, res) => {
    const logSource = 'businessesController.getUserBusinesses';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta }, `${logSource} enter`);
        
        const userId = req.user._id;
        const businesses = await Business.find({ userId: userId }).sort({ active: -1 });
        
        logger.info({ ...meta, count: businesses.length }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { businesses },
            message: BUSINESS_MESSAGES.GET_ALL_SUCCESS,
            logSource
        });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);        
        Sentry.captureException(err);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.GET_ALL_ERROR,
            logSource
        });
    }
};

/**
 * מחזיר עסקים לפי פרמטרים
 * @param {Object} req - אובייקט הבקשה
 * @param {Object} res - אובייקט התגובה
 */
exports.getItems = async (req, res) => {
    const logSource = 'businessesController.getItems';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta, query: req.query }, `${logSource} enter`);
        
        const { 
            q, 
            categoryName, 
            services, 
            rating, 
            lat, 
            lng, 
            maxDistance, 
            sort = 'rating', 
            page = 1, 
            limit = DEFAULT_ITEMS_PER_PAGE,
            openNow 
        } = req.query;

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || DEFAULT_ITEMS_PER_PAGE;
        const skip = (pageNum - 1) * limitNum;

        // בדיקה אם המשתמש מחובר
        const userId = req.user ? req.user._id : null;

        let query = q ? 
            await buildSearchQuery(q) : 
            await buildFilterQuery(categoryName, services, rating);

        let result;
        let sortOption;

        const needsLocationFiltering = maxDistance && lat && lng;
        const needsLocationSorting = (sort === 'popular_nearby' || sort === 'distance') && lat && lng;
        
        if (needsLocationFiltering || needsLocationSorting) {
            logger.info({ 
                ...meta, 
                coordinates: [parseFloat(lng), parseFloat(lat)],
                maxDistance 
            }, `${logSource} using geoNear pipeline`);
            
            const coordinates = [parseFloat(lng), parseFloat(lat)];
            
            // הוספת שלב לחישוב ציון הרלוונטיות הטקסטואלית
            const textScoreStage = q ? [
                { $addFields: { textScore: { $meta: "textScore" } } }
            ] : [];

            const pipeline = [
                ...buildGeoNearPipeline(coordinates, query, sort, maxDistance),
                ...textScoreStage,
                ...buildLookupPipeline(skip, limitNum)
            ];

            // שקלול המרחק, הדירוג וציון הרלוונטיות הטקסטואלית
            if (q && sort === 'popular_nearby') {
                pipeline.push({
                    $addFields: {
                        combinedScore: {
                            $add: [
                                { $multiply: [{ $divide: ["$distance", 1000] }, -0.1] }, // משקל שלילי למרחק
                                { $multiply: ["$rating", 0.3] },                         // משקל חיובי לדירוג
                                { $multiply: ["$textScore", 0.6] }                      // משקל גבוה להתאמה טקסטואלית
                            ]
                        }
                    }
                });
                pipeline.push({ $sort: { combinedScore: -1 } });
            }

            const [businesses, total] = await Promise.all([
                Business.aggregate(pipeline),
                Business.countDocuments(query)
            ]);

            // הוספת סטטוס מועדפים אם המשתמש מחובר
            let businessesWithFavorites = businesses;
            if (userId) {
                const Favorite = require('../models/favorite');
                const businessIds = businesses.map(b => b._id);
                const userFavorites = await Favorite.find({ 
                    user_id: userId, 
                    business_id: { $in: businessIds },
                    active: true 
                }).select('business_id');
                
                const favoriteMap = new Map();
                businessIds.forEach(id => {
                    favoriteMap.set(id.toString(), false);
                });
                
                userFavorites.forEach(fav => {
                    favoriteMap.set(fav.business_id.toString(), true);
                });
                
                businessesWithFavorites = businesses.map(business => ({
                    ...business,
                    isFavorite: favoriteMap.get(business._id.toString()) || false
                }));
            } else {
                businessesWithFavorites = businesses.map(business => ({
                    ...business,
                    isFavorite: false
                }));
            }

            result = {
                data: businessesWithFavorites,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasMore: pageNum < Math.ceil(total / limitNum)
                }
            };
        } else {
            logger.info({ ...meta }, `${logSource} using regular find pipeline`);
            
            // טיפול במיון לפי רלוונטיות טקסטואלית
            if (q) {
                sortOption = { score: { $meta: "textScore" } };
            } else {
                sortOption = {
                    rating: { rating: -1 },
                    name: { name: 1 },
                    newest: { createdAt: -1 }
                }[sort] || { rating: -1 };
            }

            const [businesses, total] = await Promise.all([
                Business.find(query)
                    .select(q ? { score: { $meta: "textScore" }, logo: 1, name: 1, address: 1, phone: 1, email: 1, rating: 1, categoryId: 1, services: 1, userId: 1, createdAt: 1, updatedAt: 1, active: 1, location: 1 } : {})
                    .populate('categoryId', 'name color logo')
                    .populate('services', 'name')
                    .populate('userId', 'firstName lastName')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Business.countDocuments(query)
            ]);

            // הוספת סטטוס מועדפים אם המשתמש מחובר
            let businessesWithFavorites = businesses;
            if (userId) {
                const Favorite = require('../models/favorite');
                const businessIds = businesses.map(b => b._id);
                const userFavorites = await Favorite.find({ 
                    user_id: userId, 
                    business_id: { $in: businessIds },
                    active: true 
                }).select('business_id');
                
                const favoriteMap = new Map();
                businessIds.forEach(id => {
                    favoriteMap.set(id.toString(), false);
                });
                
                userFavorites.forEach(fav => {
                    favoriteMap.set(fav.business_id.toString(), true);
                });
                
                businessesWithFavorites = businesses.map(business => ({
                    ...business,
                    isFavorite: favoriteMap.get(business._id.toString()) || false
                }));
            } else {
                businessesWithFavorites = businesses.map(business => ({
                    ...business,
                    isFavorite: false
                }));
            }
            // openNow post-filter (applies to current page set)
            const requireOpenNow = String(openNow) === 'true';
            if (requireOpenNow) {
                const isBusinessOpenNow = (b) => {
                    try {
                        if (!Array.isArray(b.openingHours) || !b.openingHours.length) return true;
                        const now = new Date();
                        const day = now.getDay();
                        const todays = (b.openingHours || []).find(h => Number(h.day) === day);
                        if (!todays || todays.closed) return false;
                        const toMinutes = (str) => {
                            if (!str || typeof str !== 'string') return null;
                            const [hh, mm] = str.split(':').map(Number);
                            return (hh * 60) + (mm || 0);
                        };
                        const minutesNow = now.getHours() * 60 + now.getMinutes();
                        return (todays.ranges || []).some(r => {
                            const o = toMinutes(r.open);
                            const c = toMinutes(r.close);
                            if (o === null || c === null) return false;
                            return minutesNow >= o && minutesNow <= c;
                        });
                    } catch (_) { return false; }
                };
                businessesWithFavorites = businessesWithFavorites.filter(isBusinessOpenNow);
            }

            result = {
                data: businessesWithFavorites,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasMore: pageNum < Math.ceil(total / limitNum)
                }
            };
        }

        logger.info({ 
            ...meta, 
            total: result.pagination.total,
            returned: result.data.length 
        }, `${logSource} complete`);
        
        return successResponse({
            res,
            req,
            data: { businesses: result.data, pagination: result.pagination },
            message: BUSINESS_MESSAGES.GET_ALL_SUCCESS,
            logSource
        });

    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);        
        Sentry.captureException(err);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.GET_ALL_ERROR,
            logSource
        });
    }
};

exports.getBusinessById = async (req, res) => {
    const logSource = 'businessesController.getBusinessById';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta, businessId: req.params.id }, `${logSource} enter`);
        
        const business = await Business.findById(req.params.id)
            .populate('categoryId', 'name color logo')
            .populate('services');

        if (!business) {
            logger.warn({ ...meta, businessId: req.params.id }, BUSINESS_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: BUSINESS_MESSAGES.NOT_FOUND,
                logSource
            });
        }

        logger.info({ ...meta, businessId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { business },
            message: BUSINESS_MESSAGES.GET_BY_ID_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.GET_BY_ID_ERROR,
            logSource
        });
    }
};

exports.deleteBusiness = async (req, res) => {
    const logSource = 'businessesController.deleteBusiness';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta, businessId: req.params.id }, `${logSource} enter`);
        
        const userId = req.user._id;
        const businessId = req.params.id;
        
        const business = await Business.findById(businessId);
        if (!business) {
            logger.warn({ ...meta, businessId }, BUSINESS_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: BUSINESS_MESSAGES.NOT_FOUND,
                logSource
            });
        }

        // Updated authorization check
        if (String(business.userId) !== String(userId) && req.user.role !== 'admin') {
            logger.warn({ 
                ...meta, 
                businessId,
                businessUserId: String(business.userId),
                requestUserId: String(userId) 
            }, BUSINESS_MESSAGES.UNAUTHORIZED_DELETE);
            return errorResponse({
                res,
                req,
                status: 403,
                message: BUSINESS_MESSAGES.UNAUTHORIZED_DELETE,
                logSource
            });
        }

        business.active = false;
        await business.save();

        logger.info({ ...meta, businessId }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: null,
            message: BUSINESS_MESSAGES.DELETE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.DELETE_ERROR,
            logSource
        });
    }
};

exports.restoreBusiness = async (req, res) => {
    const logSource = 'businessesController.restoreBusiness';
    const meta = getRequestMeta(req, logSource);
    
    try {
        logger.info({ ...meta, businessId: req.params.id }, `${logSource} enter`);
        
        const userId = req.user._id;
        const businessId = req.params.id;

        const business = await Business.findById(businessId);
        if (!business) {
            logger.warn({ ...meta, businessId }, BUSINESS_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: BUSINESS_MESSAGES.NOT_FOUND,
                logSource
            });
        }

        if (String(business.userId) !== String(userId) && req.user.role !== 'admin') {
            logger.warn({ 
                ...meta, 
                businessId,
                businessUserId: String(business.userId),
                requestUserId: String(userId) 
            }, BUSINESS_MESSAGES.UNAUTHORIZED_RESTORE);
            return errorResponse({
                res,
                req,
                status: 403,
                message: BUSINESS_MESSAGES.UNAUTHORIZED_RESTORE,
                logSource
            });
        }

        business.active = true;
        await business.save();

        logger.info({ ...meta, businessId }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { business },
            message: BUSINESS_MESSAGES.RESTORE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            status: 500,
            message: BUSINESS_MESSAGES.RESTORE_ERROR,
            logSource
        });
    }
};
