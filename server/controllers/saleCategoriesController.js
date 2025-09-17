const SaleCategory = require('../models/SaleCategory');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');
const { SALE_CATEGORY_MESSAGES } = require('../messages');

exports.getAll = async (req, res) => {
    const logSource = 'saleCategoriesController.getAll';
    const meta = getRequestMeta(req, logSource);
    try {
        const categories = await SaleCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 });
        return successResponse({ res, req, data: { categories }, message: SALE_CATEGORY_MESSAGES.GET_ALL_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_CATEGORY_MESSAGES.GET_ALL_ERROR, logSource });
    }
};

exports.create = async (req, res) => {
    const logSource = 'saleCategoriesController.create';
    const meta = getRequestMeta(req, logSource);
    try {
        const { name, description, icon, color, sortOrder } = req.body;
        const doc = new SaleCategory({ name, description, icon, color, sortOrder });
        const saved = await doc.save();
        return successResponse({ res, req, status: 201, data: { category: saved }, message: SALE_CATEGORY_MESSAGES.CREATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_CATEGORY_MESSAGES.CREATE_ERROR, logSource });
    }
};

exports.update = async (req, res) => {
    const logSource = 'saleCategoriesController.update';
    const meta = getRequestMeta(req, logSource);
    try {
        const doc = await SaleCategory.findById(req.params.id);
        if (!doc) return errorResponse({ res, req, status: 404, message: SALE_CATEGORY_MESSAGES.NOT_FOUND, logSource });
        const { name, description, icon, color, sortOrder, active } = req.body;
        if (name) doc.name = name;
        if (description !== undefined) doc.description = description;
        if (icon !== undefined) doc.icon = icon;
        if (color !== undefined) doc.color = color;
        if (sortOrder !== undefined) doc.sortOrder = Number(sortOrder);
        if (typeof active !== 'undefined') doc.active = !!active;
        await doc.save();
        return successResponse({ res, req, data: { category: doc }, message: SALE_CATEGORY_MESSAGES.UPDATE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_CATEGORY_MESSAGES.UPDATE_ERROR, logSource });
    }
};

exports.delete = async (req, res) => {
    const logSource = 'saleCategoriesController.delete';
    const meta = getRequestMeta(req, logSource);
    try {
        const doc = await SaleCategory.findById(req.params.id);
        if (!doc) return errorResponse({ res, req, status: 404, message: SALE_CATEGORY_MESSAGES.NOT_FOUND, logSource });
        doc.active = false;
        await doc.save();
        return successResponse({ res, req, data: null, message: SALE_CATEGORY_MESSAGES.DELETE_SUCCESS, logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: SALE_CATEGORY_MESSAGES.DELETE_ERROR, logSource });
    }
};


