const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: String,
    description: String,
    userId: String,
    photoPath: String
});

const Item = mongoose.model('items', itemSchema);

module.exports = Item;
