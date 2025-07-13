const express = require("express");
const router = express.Router();
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");
const upload = require('../config/multerConfig');
const { requireAdmin, publicRoute } = require('../middlewares/authMiddleware');

router.get("/", publicRoute, getAllCategories);
router.post("/", requireAdmin, upload.single('logo'), createCategory);
router.put("/:id", requireAdmin, upload.single('logo'), updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

module.exports = router;
