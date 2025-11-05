const SaleSubcategory = require('../models/SaleSubcategory');
const logger = require('../logger');
const Sentry = require('../sentry');
const { errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');

exports.getAll = async (req, res) => {
    const logSource = 'saleSubcategoriesController.getAll';
    const meta = getRequestMeta(req, logSource);
    try {
        const matchActive = { $or: [{ active: true }, { active: { $exists: false } }] };
        const subs = await SaleSubcategory.find(matchActive).sort({ sortOrder: 1, name: 1 });
        return successResponse({ res, req, data: { subcategories: subs }, message: 'GET_ALL_SUCCESS', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'GET_ALL_ERROR', logSource });
    }
};

exports.getByCategory = async (req, res) => {
    const logSource = 'saleSubcategoriesController.getByCategory';
    const meta = getRequestMeta(req, logSource);
    try {
        const { categoryId } = req.params;
        const matchActive = { $or: [{ active: true }, { active: { $exists: false } }] };
        const subs = await SaleSubcategory.find({ saleCategoryId: categoryId, ...matchActive }).sort({ sortOrder: 1, name: 1 });
        return successResponse({ res, req, data: { subcategories: subs }, message: 'GET_BY_CATEGORY_SUCCESS', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'GET_BY_CATEGORY_ERROR', logSource });
    }
};

exports.create = async (req, res) => {
    const logSource = 'saleSubcategoriesController.create';
    const meta = getRequestMeta(req, logSource);
    try {
        const { name, description, icon, color, sortOrder, saleCategoryId, active } = req.body;
        const doc = new SaleSubcategory({ name, description, icon, color, sortOrder, saleCategoryId, active });
        const saved = await doc.save();
        return successResponse({ res, req, status: 201, data: { subcategory: saved }, message: 'CREATE_SUCCESS', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'CREATE_ERROR', logSource });
    }
};

exports.update = async (req, res) => {
    const logSource = 'saleSubcategoriesController.update';
    const meta = getRequestMeta(req, logSource);
    try {
        const doc = await SaleSubcategory.findById(req.params.id);
        if (!doc) return errorResponse({ res, req, status: 404, message: 'NOT_FOUND', logSource });
        const { name, description, icon, color, sortOrder, saleCategoryId, active } = req.body;
        if (name !== undefined) doc.name = name;
        if (description !== undefined) doc.description = description;
        if (icon !== undefined) doc.icon = icon;
        if (color !== undefined) doc.color = color;
        if (sortOrder !== undefined) doc.sortOrder = Number(sortOrder);
        if (saleCategoryId !== undefined) doc.saleCategoryId = saleCategoryId;
        if (active !== undefined) doc.active = !!active;
        await doc.save();
        return successResponse({ res, req, data: { subcategory: doc }, message: 'UPDATE_SUCCESS', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'UPDATE_ERROR', logSource });
    }
};

exports.remove = async (req, res) => {
    const logSource = 'saleSubcategoriesController.remove';
    const meta = getRequestMeta(req, logSource);
    try {
        const doc = await SaleSubcategory.findById(req.params.id);
        if (!doc) return errorResponse({ res, req, status: 404, message: 'NOT_FOUND', logSource });
        doc.active = false;
        await doc.save();
        return successResponse({ res, req, data: null, message: 'DELETE_SUCCESS', logSource });
    } catch (err) {
        logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
        Sentry.captureException(err);
        return errorResponse({ res, req, status: 500, message: 'DELETE_ERROR', logSource });
    }
};


