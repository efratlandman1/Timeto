const Business = require("../models/business");
const AuthUtils = require('../utils/authUtils');

exports.uploadBusinesses = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const newBusiness = new Business({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            userId: userId,
            photoPath: req.file.path // Path to uploaded photo
        });

        const savedItem = await newBusiness.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error uploading business: ', error);
        res.status(500).json({ error: 'Failed to upload business' });
    }
};

exports.getItems = async (req, res) => {
    try {
        const businesses = await business.find({});
        res.status(200).json(businesses);
    } catch (err) {
        res.status(500).json({message: err.message});
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

