const Item = require("../models/Items");
const AuthUtils = require('../utils/authUtils');

exports.uploadItem = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const newItem = new Item({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            userId: userId,
            photoPath: req.file.path // Path to uploaded photo
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error uploading item: ', error);
        res.status(500).json({ error: 'Failed to upload item' });
    }
};

exports.getItems = async (req, res) => {
    try {
        const items = await Item.find({});
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

exports.getUserItems = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        let userId = AuthUtils.extractUserId(token);
        const items = await Item.find({userId: userId});
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

