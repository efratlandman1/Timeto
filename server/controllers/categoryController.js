const Category = require("../models/category");
const { successResponse, errorResponse, getRequestMeta } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require("@sentry/node");
const messages = require("../messages");

exports.getAllCategories = async (req, res) => {
    const logSource = 'categoryController.getAllCategories';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const categories = await Category.find({});
        logger.info({ ...meta, count: categories.length }, `${logSource} complete`);
        
        return successResponse({
            res,
            req,
            data: { categories },
            message: messages.CATEGORY_MESSAGES.GET_ALL_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.CATEGORY_MESSAGES.GET_ALL_ERROR,
            logSource
        });
    }
};

exports.createCategory = async (req, res) => {
    const logSource = 'categoryController.createCategory';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const { name } = req.body;
        const categoryData = { name };
        if (req.file) {
            // Assuming the server is configured to serve static files from the upload path
            categoryData.logo = req.file.path;
        }
        const newCategory = new Category(categoryData);
        await newCategory.save();
        
        logger.info({ ...meta, categoryId: newCategory._id }, `${logSource} complete`);
        
        return successResponse({
            res,
            req,
            data: { category: newCategory },
            message: messages.CATEGORY_MESSAGES.CREATE_SUCCESS,
            status: 201,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.CATEGORY_MESSAGES.CREATE_ERROR,
            logSource
        });
    }
};

exports.updateCategory = async (req, res) => {
    const logSource = 'categoryController.updateCategory';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta, categoryId: req.params.id }, `${logSource} enter`);
    
    try {
        const { name } = req.body;
        const updateData = { name };
        if (req.file) {
            updateData.logo = req.file.path;
        }

        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedCategory) {
            logger.warn({ ...meta, categoryId: req.params.id }, messages.CATEGORY_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.CATEGORY_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        logger.info({ ...meta, categoryId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { category: updatedCategory },
            message: messages.CATEGORY_MESSAGES.UPDATE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.CATEGORY_MESSAGES.UPDATE_ERROR,
            logSource
        });
    }
};

exports.deleteCategory = async (req, res) => {
    const logSource = 'categoryController.deleteCategory';
    const meta = getRequestMeta(req, logSource);

    logger.info({ ...meta, categoryId: req.params.id }, `${logSource} enter`);

    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            logger.warn({ ...meta, categoryId: req.params.id }, messages.CATEGORY_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.CATEGORY_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        logger.info({ ...meta, categoryId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            message: messages.CATEGORY_MESSAGES.DELETE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.CATEGORY_MESSAGES.DELETE_ERROR,
            logSource
        });
    }
};
