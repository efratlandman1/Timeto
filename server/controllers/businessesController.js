const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');
const Category = require('../models/category');
const mongoose = require('mongoose');
const Service = require('../models/service');
const Feedback = require('../models/feedback');

exports.getAllBusinesses = async (req, res) => {
    try {
        const businesses = await Business.find({})
            .populate('categoryId', 'name')
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
      logo: req.file?.filename || ''
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
    existingBusiness.prefix = req.body.prefix || existingBusiness.prefix;
    existingBusiness.phone = req.body.phone || existingBusiness.phone;
    existingBusiness.categoryId = req.body.categoryId || existingBusiness.categoryId;
    // existingBusiness.services = req.body.services || existingBusiness.services; // עדכון שירותים
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
const DEFAULT_ITEMS_PER_PAGE = 8; // הגדרת ברירת מחדל


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


exports.getItems = async (req, res) => {
  try {
    const { q, categoryName, services, rating } = req.query;
    const query = {};
    query.active = true;
    const SORT_FIELDS = {
        rating: { rating: -1 },
        name: { name: 1 },
        distance: { distance: 1 },
        newest: { createdAt: -1 },
        popular_nearby: [['distance', 1], ['rating', -1]]
    };
    const sort = req.query.sort || 'rating';
    let sortOption = SORT_FIELDS[sort] || { rating: -1 }; // Default to rating if invalid sort option

    // Handle compound sorting for popular_nearby
    if (sort === 'popular_nearby') {
        sortOption = Object.fromEntries(SORT_FIELDS[sort]);
    }
    
    // === חיפוש חופשי אם קיים q ===
    if (q && q.trim().length > 0) {
        const regex = new RegExp(q, 'i'); // Case-insensitive

        const matchingCategories = await Category.find({ name: regex });
        const categoryIds = matchingCategories.map(cat => cat._id);

        const matchingServices = await Service.find({ name: regex });
        const matchingServiceIds = matchingServices.map(service => service._id);

        const searchConditions = {
            $and: [
                { active: true }, 
                {
                    $or: [
                        { name: regex },
                        { address: regex },
                        { email: regex },
                        { phone: { $regex: q } },
                        { categoryId: { $in: categoryIds } },
                        { services: { $in: matchingServiceIds } }
                    ]
                }
            ]
        };

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || DEFAULT_ITEMS_PER_PAGE;
        const skip = (page - 1) * limit;

        const [businesses, total] = await Promise.all([
            Business.find(searchConditions)
                .populate('categoryId')
                .populate('services')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'name'),
            Business.countDocuments(searchConditions)
        ]);

        const results = businesses.map(business => {
            const businessObj = business.toObject();
            businessObj.categoryName = business.categoryId?.name || '';
            return businessObj;
        });

        return res.json({
            data: results,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit)
            }
        });
    }

    // === סינון רגיל אם אין q ===
    if (categoryName) {
        const category = await Category.findOne({ name: categoryName });
        if (category) {
            query.categoryId = category._id;
        } else {
            return res.status(404).json({ message: "Category not found" });
        }
    }

    if (services) {
        let serviceList = Array.isArray(services) ? services : [services];
        const objectIds = serviceList.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (objectIds.length === serviceList.length) {
            query.services = { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) };
        } else {
            const serviceDocs = await Service.find({ name: { $in: serviceList } });
            const ids = serviceDocs.map(s => s._id);
            if (ids.length > 0) query.services = { $in: ids };
        }
    }

    if (rating) {
        query.rating = { $gte: Number(rating) };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || DEFAULT_ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    console.log("query:", query);
    console.log("sortOption:", sortOption);

    const [businesses, total] = await Promise.all([
        Business.find(query)
            .populate('categoryId')
            .populate('services')
            .sort(sortOption)  // Apply the sort option here
            .skip(skip)
            .limit(limit),
        Business.countDocuments(query),
    ]);

    res.json({
        data: businesses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: page < Math.ceil(total / limit)
        },
    });

  } catch (err) {
    console.error("Error in getItems:", err);
    res.status(500).json({ message: 'Internal server error' });
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
      .populate('categoryId')
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
