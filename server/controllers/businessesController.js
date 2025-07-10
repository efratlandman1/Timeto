const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');
const Category = require('../models/category');
const mongoose = require('mongoose');
const Service = require('../models/service');
const Feedback = require('../models/feedback');
const mapsUtils = require('../utils/mapsUtils');

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
    console.log('buildGeoNearPipeline - Input:', { coordinates, sort, maxDistance });
    
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
        console.log(`Added maxDistance: ${maxDistance} km = ${maxDistanceMeters} meters`);
    } else {
        console.log('No valid maxDistance provided');
    }

    console.log('Final geoNear stage:', JSON.stringify(geoNearStage, null, 2));

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
    try {
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

        res.status(200).json(businessesWithFeedback);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: err.message});
    }
};

exports.uploadBusinesses = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);

        if (req.body.id) {
            return updateBusiness(req, res, userId);

        } else {
            return createBusiness(req, res, userId);
        }
    } catch (error) {
        console.error('Error handling business upload: ', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

const createBusiness = async (req, res, userId) => {
  try {
    console.log("createBusiness");
    const openingHours = JSON.parse(req.body.openingHours || '[]');
    const services = JSON.parse(req.body.services || '[]');

    // Get coordinates from address
    const location = await mapsUtils.geocode(req.body.address);
    
    // ולידציה נוספת של הקואורדינטות
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates received from geocoding service' });
    }
    
    console.log(`Creating business with coordinates: [${location.lng}, ${location.lat}] for address: ${req.body.address}`);
    
    const newBusiness = new Business({
      name: req.body.name,
      email: req.body.email,
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
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating business: ', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
};

const updateBusiness = async (req, res, userId) => {
  try {
    const existingBusiness = await Business.findById(req.body.id);

    if (!existingBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }
    if (existingBusiness.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this business' });
    }

    // If address is being updated, get new coordinates
    if (req.body.address && req.body.address !== existingBusiness.address) {
      const location = await mapsUtils.geocode(req.body.address);
      
      // ולידציה של הקואורדינטות
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return res.status(400).json({ error: 'Invalid coordinates received from geocoding service' });
      }
      
      console.log(`Updating business coordinates: [${location.lng}, ${location.lat}] for address: ${req.body.address}`);
      
      existingBusiness.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      };
    }

    existingBusiness.name = req.body.name || existingBusiness.name;
    existingBusiness.email = req.body.email || existingBusiness.email;
    existingBusiness.prefix = req.body.prefix || existingBusiness.prefix;
    existingBusiness.phone = req.body.phone || existingBusiness.phone;
    existingBusiness.categoryId = req.body.categoryId || existingBusiness.categoryId;
    existingBusiness.services = typeof req.body.services === 'string' ? JSON.parse(req.body.services) : (req.body.services || existingBusiness.services);
    existingBusiness.description = req.body.description || existingBusiness.description;
    existingBusiness.address = req.body.address || existingBusiness.address;
    existingBusiness.logo = req.file?.path || existingBusiness.logo;
    existingBusiness.openingHours = typeof req.body.openingHours === 'string' ? JSON.parse(req.body.openingHours) : (req.body.openingHours || existingBusiness.openingHours);

    await existingBusiness.save();
    res.status(200).json({ message: 'Business updated successfully', business: existingBusiness });
  } catch (error) {
    console.error('Error updating business: ', error);
    res.status(500).json({ error: 'Failed to update business' });
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
    try {
         const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);
        const businesses = await Business.find({ userId: userId }).sort({ active: -1 });
        res.status(200).json(businesses);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

/**
 * מחזיר עסקים לפי פרמטרים
 * @param {Object} req - אובייקט הבקשה
 * @param {Object} res - אובייקט התגובה
 */
exports.getItems = async (req, res) => {
    try {
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
            limit = DEFAULT_ITEMS_PER_PAGE 
        } = req.query;

        console.log('getItems - Query params:', { 
            q, categoryName, services, rating, lat, lng, maxDistance, sort, page, limit 
        });

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || DEFAULT_ITEMS_PER_PAGE;
        const skip = (pageNum - 1) * limitNum;

        // בדיקה אם המשתמש מחובר
        let userId = null;
        try {
            const token = req.headers['authorization']?.split(' ')[1];
            if (token) {
                userId = AuthUtils.extractUserId(token);
            }
        } catch (error) {
            console.log('User not authenticated or invalid token');
        }

        let query = q ? 
            await buildSearchQuery(q) : 
            await buildFilterQuery(categoryName, services, rating);

        let result;
        let sortOption;

        const needsLocationFiltering = maxDistance && lat && lng;
        const needsLocationSorting = (sort === 'popular_nearby' || sort === 'distance') && lat && lng;
        
        if (needsLocationFiltering || needsLocationSorting) {
            console.log('Using geoNear pipeline with coordinates:', [parseFloat(lng), parseFloat(lat)]);
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
                const businessIds = businesses.map(b => b._id);
                const Favorite = require('../models/favorite');
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
            console.log('Using regular find pipeline (no location filtering)');
            
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
                    .select(q ? { score: { $meta: "textScore" } } : {})
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

        res.json(result);

    } catch (err) {
        console.error('Error in getItems:', err);
        res.status(500).json({ message: err.message });
    }
};

//no needed auth
exports.getBusinessById = async (req, res) => {
  try {
    //  const token = req.headers['authorization']?.split(' ')[1];
    //  console.log("token",token);
    //  let userId = AuthUtils.extractUserId(token);
    //  console.log("AuthUtils.extractUserId",userId);
     
    const business = await Business.findById(req.params.id)
      .populate('categoryId', 'name color logo')
      .populate('services');

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    // let businessUser = business.userId.toString();
    // console.log("req.body.userId.toString()",businessUser);  
    //  if (businessUser !== userId) {
    //   return res.status(403).json({ error: 'Unauthorized to edit this business' });
    // }

    res.status(200).json(business);
  } catch (error) {
    console.error('Error fetching business by ID:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    console.log("deleteBusiness :");
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    const businessId = req.params.id;
    console.log("deleteBusiness businessId:",businessId);
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this business' });
    }

    business.active = false;
    await business.save();

    res.status(200).json({ message: 'Business marked as inactive' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
};

exports.restoreBusiness = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to restore this business' });
    }

    business.active = true;
    await business.save();

    res.status(200).json({ message: 'Business restored successfully', business });
  } catch (error) {
    console.error('Error restoring business:', error);
    res.status(500).json({ error: 'Failed to restore business' });
  }
};
