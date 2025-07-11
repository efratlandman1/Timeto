const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    // subcategories: [{
    //     name: { type: String, required: true }
    // }],
    logo: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('categories', CategorySchema);
