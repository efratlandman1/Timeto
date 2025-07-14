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
const { sanitizeRequest, validateCategory, validateMongoIdParam } = require('../middlewares/inputValidation');
const { fileUploadSecurity } = require('../middlewares/fileUploadSecurity');

router.get("/", publicRoute, generalLimiter, sanitizeRequest, getAllCategories);
router.post("/", requireAdmin, writeLimiter, sanitizeRequest, validateCategory, upload.single('logo'), fileUploadSecurity, createCategory);
router.put("/:id", requireAdmin, writeLimiter, sanitizeRequest, validateCategory, upload.single('logo'), fileUploadSecurity, updateCategory);
router.delete("/:id", requireAdmin, writeLimiter, sanitizeRequest, validateMongoIdParam('id', 'Category ID'), deleteCategory);

module.exports = router;
