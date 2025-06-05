const Category = require("../models/category");

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const categoryData = { name };
        if (req.file) {
            // Assuming the server is configured to serve static files from the upload path
            categoryData.logo = req.file.path;
        }
        const newCategory = new Category(categoryData);
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: "Error creating category", error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const updateData = { name };
        if (req.file) {
            updateData.logo = req.file.path;
        }

        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: "Error updating category", error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {

    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};
