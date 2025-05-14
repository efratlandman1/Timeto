const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');
const Category = require('../models/category');
const mongoose = require('mongoose');

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
        const newBusiness = new Business({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            categoryId: req.body.categoryId,
            description: req.body.description || '',
            userId: userId,
            address: req.body.address,
            logo: req.file?.path || ''
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

        existingBusiness.name = req.body.name || existingBusiness.name;
        existingBusiness.email = req.body.email || existingBusiness.email;
        existingBusiness.phone = req.body.phone || existingBusiness.phone;
        existingBusiness.categoryId = req.body.categoryId || existingBusiness.categoryId;
        existingBusiness.description = req.body.description || existingBusiness.description;
        existingBusiness.address = req.body.address || existingBusiness.address;
        existingBusiness.logo = req.file?.path || existingBusiness.logo;

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
const DEFAULT_ITEMS_PER_PAGE = 8; // הגדרת ברירת מחדל

exports.getItems = async (req, res) => {
    try {
        console.log("Received query params:", req.query);

        const { q, categoryName, subcategories, rating } = req.query;

        // מיפוי אפשרויות מיון
        const SORT_FIELDS = {
            rating: { rating: -1 },
            name: { name: 1 },
            distance: { distance: 1 }
        };

        const sort = req.query.sort || 'rating';
        const sortOption = SORT_FIELDS[sort] || { rating: -1 };

        const query = {};

        // סינון לפי קטגוריה
        if (categoryName) {
            const category = await Category.findOne({ name: categoryName });
            if (category) {
                query.categoryId = category._id;
            } else {
                return res.json({
                    data: [],
                    pagination: {
                        total: 0,
                        page: 1,
                        limit: 0,
                        totalPages: 0
                    }
                });
            }
        }

        // סינון לפי תתי קטגוריות
        if (subcategories) {
            const serviceList = Array.isArray(subcategories) ? subcategories : [subcategories];
            query.subCategoryIds = { $all: serviceList };
        }

        // סינון לפי דירוג
        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || DEFAULT_ITEMS_PER_PAGE;
        const skip = (page - 1) * limit;

        const [businesses, total] = await Promise.all([
            Business.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'name'),
            Business.countDocuments(query)
        ]);

        const results = businesses.map(business => {
            const businessObj = business.toObject();
            businessObj.categoryName = business.categoryId?.name || '';
            return businessObj;
        });

        res.json({
            data: results,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error("Error in getItems:", err);
        res.status(500).json({ message: err.message });
    }
};


exports.getUserBusinesses = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);
        const business = await Business.find({userId: userId});
        res.status(200).json(business);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

// exports.searchBusinesses = async (req, res) => {
//     try {
//         console.log('searchBusinesses:');
//         const query = req.query.q;
//         console.log('req.query.q:',req.query.q);
//         if (!query || query.trim().length === 0) {
//             return res.status(400).json({ message: "Missing query parameter" });
//         }

//         const regex = new RegExp(query, 'i'); // Case-insensitive

//         const matchingCategories = await Category.find({
//             $or: [
//                 { name: regex }
//             ]
//         });
//         const categoryIds = matchingCategories.map(cat => cat._id);

//         const businesses = await Business.find({
//             $or: [
//                 { name: regex },
//                 { address: regex },
//                 { email: regex },
//                 // { description: regex },
//                 { phone: { $regex: query } },
//                 { categoryId: { $in: categoryIds } },
//                 { subCategoryIds: { $in: [regex] } }
//             ]
//         }).limit(10)
//         .populate('categoryId', 'name')

//         console.log(businesses);
        
//         const resultsWithCategoryName = businesses.map(business => {
//             const categoryName = business.categoryId?.name || '';
//             return {
//                 ...business.toObject(),
//                 categoryName
//             };
//         });

//         res.json(resultsWithCategoryName);

//     } catch (err) {
//         console.error("Error in searchBusinesses:", err);
//         res.status(500).json({ message: err.message });
//     }
// };
exports.getBusinessById = async (req, res) => {
    try {
    console.log(' req.params.id', req.params.id);
      const businessId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({ message: 'מזהה לא תקין' });
      }
  
      const business = await Business.findById(businessId);
      console.log('business', business);
      if (!business) {
        return res.status(404).json({ message: 'העסק לא נמצא' });
      }
  
      res.json(business);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'שגיאה בשרת' });
    }
  };