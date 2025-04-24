const Category = require("../models/category");

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error });
    }
};
