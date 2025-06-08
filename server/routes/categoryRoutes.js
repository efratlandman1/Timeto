const express = require("express");
const router = express.Router();
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");
const upload = require('../config/multerConfig');
const adminAuth = require('../middlewares/adminAuth');

router.get("/", getAllCategories);
router.post("/", adminAuth, upload.single('logo'), createCategory);
router.put("/:id", adminAuth, upload.single('logo'), updateCategory);
router.delete("/:id", adminAuth, deleteCategory);

module.exports = router;
