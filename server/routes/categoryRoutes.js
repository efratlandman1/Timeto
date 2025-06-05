const express = require("express");
const router = express.Router();
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");
const upload = require('../config/multerConfig');

router.get("/", getAllCategories);
router.post("/", upload.single('logo'), createCategory);
router.put("/:id", upload.single('logo'), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
