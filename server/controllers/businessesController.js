const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');
const Category = require('../models/category');

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
        services: req.body.services || [],
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
    existingBusiness.services = req.body.services || existingBusiness.services; // עדכון שירותים
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


exports.getItems = async (req, res) => {
  try {
    console.log("Received query params:", req.query);

    const { categoryName, subcategories, rating } = req.query;
    const query = {};

    if (categoryName) {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        query.categoryId = category._id;
      } else {
        console.log("Category not found");
      }
    }

    if (subcategories) {
      const serviceList = Array.isArray(subcategories) ? subcategories : [subcategories];
      query.services = { $all: serviceList.map(id => mongoose.Types.ObjectId(id)) };
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('categoryId')
        .populate('services')
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
      },
    });
  } catch (err) {
    console.error("Error in getItems:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getUserBusinesses = async (req, res) => {
    try {
         const token = req.headers['authorization']?.split(' ')[1];
         console.log(token);
        let userId = AuthUtils.extractUserId(token);
        console.log(userId);
        const business = await Business.find({userId: userId});
        res.status(200).json(business);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

