const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    subcategories: [SubcategorySchema]
});

module.exports = mongoose.model("Categories", CategorySchema);
