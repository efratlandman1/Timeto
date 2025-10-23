const Suggestion = require('../models/Suggestion');
const Category = require('../models/category');
const mongoose = require('mongoose');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require("@sentry/node");
const messages = require("../messages");

// Create a new suggestion
const createSuggestion = async (req, res) => {
  const logSource = 'suggestionController.createSuggestion';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, bodyPreview: {
    domain: req.body?.domain,
    type: req.body?.type,
    parent_category_id: req.body?.parent_category_id,
    sale_category_id: req.body?.sale_category_id
  } }, `${logSource} enter`);
  
  try {
    const { domain = 'business', type, name_he, name_en, parent_category_id, sale_category_id, reason } = req.body;

    // If business service, verify that parent_category_id exists
    if (domain === 'business' && type === 'service' && parent_category_id) {
      const categoryExists = await Category.findById(parent_category_id);
      if (!categoryExists) {
        logger.warn({ ...meta, parent_category_id }, messages.SUGGESTION_MESSAGES.PARENT_CATEGORY_NOT_FOUND);
        return errorResponse({
          res,
          req,
          status: 404,
          message: messages.SUGGESTION_MESSAGES.PARENT_CATEGORY_NOT_FOUND,
          logSource
        });
      }
    }

    // Create suggestion
    const suggestion = await Suggestion.create({
      domain,
      type,
      name_he,
      name_en,
      parent_category_id: domain === 'business' && type === 'service' ? parent_category_id : undefined,
      sale_category_id: domain === 'sale' ? sale_category_id : undefined,
      reason,
      user: req.user ? req.user._id : undefined
    });

    logger.info({ ...meta, suggestionId: suggestion._id }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { suggestion },
      message: messages.SUGGESTION_MESSAGES.CREATE_SUCCESS,
      status: 201,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.CREATE_ERROR,
      logSource
    });
  }
};

// Get all suggestions (admin only)
const getAllSuggestions = async (req, res) => {
  const logSource = 'suggestionController.getAllSuggestions';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta }, `${logSource} enter`);
  
  try {
    const suggestions = await Suggestion.find()
      .populate('user', 'firstName lastName email')
      .populate('parent_category_id', 'name_he name_en')
      .populate('sale_category_id', 'name');

    logger.info({ ...meta, count: suggestions.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { suggestions },
      message: messages.SUGGESTION_MESSAGES.GET_ALL_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.GET_ALL_ERROR,
      logSource
    });
  }
};

// Get suggestion by ID (admin only)
const getSuggestion = async (req, res) => {
  const logSource = 'suggestionController.getSuggestion';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, suggestionId: req.params.id }, `${logSource} enter`);
  
  try {
    // בדיקת תקפות של suggestionId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.INVALID_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.SUGGESTION_MESSAGES.INVALID_ID,
        logSource
      });
    }

    const suggestion = await Suggestion.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('parent_category_id', 'name_he name_en')
      .populate('sale_category_id', 'name');

    if (!suggestion) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.NOT_FOUND);
      return errorResponse({
        res,
        req,
        status: 404,
        message: messages.SUGGESTION_MESSAGES.NOT_FOUND,
        logSource
      });
    }

    logger.info({ ...meta, suggestionId: req.params.id }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { suggestion },
      message: messages.SUGGESTION_MESSAGES.GET_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.GET_ERROR,
      logSource
    });
  }
};

// Update suggestion status (admin only)
const updateSuggestionStatus = async (req, res) => {
  const logSource = 'suggestionController.updateSuggestionStatus';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, suggestionId: req.params.id }, `${logSource} enter`);
  
  try {
    // בדיקת תקפות של suggestionId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.INVALID_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.SUGGESTION_MESSAGES.INVALID_ID,
        logSource
      });
    }

    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      logger.warn({ ...meta, status }, messages.SUGGESTION_MESSAGES.INVALID_STATUS);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.SUGGESTION_MESSAGES.INVALID_STATUS,
        logSource
      });
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!suggestion) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.NOT_FOUND);
      return errorResponse({
        res,
        req,
        status: 404,
        message: messages.SUGGESTION_MESSAGES.NOT_FOUND,
        logSource
      });
    }

    logger.info({ ...meta, suggestionId: req.params.id, status }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { suggestion },
      message: messages.SUGGESTION_MESSAGES.UPDATE_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.UPDATE_ERROR,
      logSource
    });
  }
};

// Delete suggestion (admin only)
const deleteSuggestion = async (req, res) => {
  const logSource = 'suggestionController.deleteSuggestion';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, suggestionId: req.params.id }, `${logSource} enter`);
  
  try {
    // בדיקת תקפות של suggestionId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.INVALID_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.SUGGESTION_MESSAGES.INVALID_ID,
        logSource
      });
    }

    const suggestion = await Suggestion.findByIdAndDelete(req.params.id);

    if (!suggestion) {
      logger.warn({ ...meta, suggestionId: req.params.id }, messages.SUGGESTION_MESSAGES.NOT_FOUND);
      return errorResponse({
        res,
        req,
        status: 404,
        message: messages.SUGGESTION_MESSAGES.NOT_FOUND,
        logSource
      });
    }

    logger.info({ ...meta, suggestionId: req.params.id }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.DELETE_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.DELETE_ERROR,
      logSource
    });
  }
};

// Get user's suggestions
const getUserSuggestions = async (req, res) => {
  const logSource = 'suggestionController.getUserSuggestions';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, userId: req.user._id }, `${logSource} enter`);
  
  try {
    const suggestions = await Suggestion.find({ user: req.user._id })
      .populate('parent_category_id', 'name_he name_en')
      .populate('sale_category_id', 'name');

    logger.info({ ...meta, userId: req.user._id, count: suggestions.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { suggestions },
      message: messages.SUGGESTION_MESSAGES.GET_USER_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SUGGESTION_MESSAGES.GET_USER_ERROR,
      logSource
    });
  }
};

module.exports = {
  createSuggestion,
  getAllSuggestions,
  getSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  getUserSuggestions
}; 