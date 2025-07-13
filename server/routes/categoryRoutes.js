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
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');

router.get("/", publicRoute, generalLimiter, getAllCategories);
router.post("/", requireAdmin, writeLimiter, upload.single('logo'), createCategory);
router.put("/:id", requireAdmin, writeLimiter, upload.single('logo'), updateCategory);
router.delete("/:id", requireAdmin, writeLimiter, deleteCategory);

module.exports = router;
