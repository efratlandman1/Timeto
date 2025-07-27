// controllers/feedbackController.js
const Feedback = require("../models/feedback");
const mongoose = require('mongoose');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require("@sentry/node");
const messages = require("../messages");

exports.createFeedback = async (req, res) => {
  const logSource = 'feedbacksController.createFeedback';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta }, `${logSource} enter`);
  
  try {
    const userId = req.user._id;
    const { business_id, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(business_id)) {
      logger.warn({ ...meta, business_id }, messages.FEEDBACK_MESSAGES.INVALID_BUSINESS_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.FEEDBACK_MESSAGES.INVALID_BUSINESS_ID,
        logSource
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      logger.warn({ ...meta, rating }, messages.FEEDBACK_MESSAGES.INVALID_RATING);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.FEEDBACK_MESSAGES.INVALID_RATING,
        logSource
      });
    }

    const feedback = new Feedback({
      user_id: new mongoose.Types.ObjectId(userId),
      business_id: new mongoose.Types.ObjectId(business_id),
      rating,
      comment
    });

    await feedback.save();

    logger.info({ ...meta, feedbackId: feedback._id, business_id }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      status: 201,
      data: { feedback },
      message: messages.FEEDBACK_MESSAGES.CREATE_SUCCESS,
      logSource
    });

  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    
    if (err.code === 11000) {
      return errorResponse({
        res,
        req,
        status: 409,
        message: messages.FEEDBACK_MESSAGES.DUPLICATE_FEEDBACK,
        logSource
      });
    }
    
    return errorResponse({
      res,
      req,
      message: messages.FEEDBACK_MESSAGES.CREATE_ERROR,
      logSource
    });
  }
};

exports.getFeedbacksForBusiness = async (req, res) => {
  const logSource = 'feedbacksController.getFeedbacksForBusiness';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, businessId: req.params.businessId }, `${logSource} enter`);
  
  try {
    const feedbacks = await Feedback.find({ business_id: req.params.businessId })
      .populate("user_id", "nickname")
      .populate("business_id", "name logo")
      .sort({ createdAt: -1 });

    logger.info({ ...meta, businessId: req.params.businessId, count: feedbacks.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { feedbacks },
      message: messages.FEEDBACK_MESSAGES.GET_ALL_SUCCESS,
      logSource
    });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({
      res,
      req,
      message: messages.FEEDBACK_MESSAGES.GET_ALL_ERROR,
      logSource
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  const logSource = 'feedbacksController.deleteFeedback';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta, feedbackId: req.params.id }, `${logSource} enter`);
  
  try {
    // בדיקת תקפות של feedbackId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn({ ...meta, feedbackId: req.params.id }, messages.FEEDBACK_MESSAGES.INVALID_FEEDBACK_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.FEEDBACK_MESSAGES.INVALID_FEEDBACK_ID,
        logSource
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      logger.warn({ ...meta, feedbackId: req.params.id }, messages.FEEDBACK_MESSAGES.NOT_FOUND);
      return errorResponse({
        res,
        req,
        status: 404,
        message: messages.FEEDBACK_MESSAGES.NOT_FOUND,
        logSource
      });
    }
    
    // בדיקת הרשאות - רק בעל הפידבק או אדמין יכולים למחוק
    if (feedback.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      logger.warn({ ...meta, feedbackId: req.params.id, userId: req.user._id, ownerId: feedback.user_id }, messages.FEEDBACK_MESSAGES.UNAUTHORIZED_DELETE);
      return errorResponse({
        res,
        req,
        status: 403,
        message: messages.FEEDBACK_MESSAGES.UNAUTHORIZED_DELETE,
        logSource
      });
    }
    
    await Feedback.findByIdAndDelete(req.params.id);
    
    logger.info({ ...meta, feedbackId: req.params.id }, `${logSource} complete`);
    return successResponse({
      res,
      req,
      message: messages.FEEDBACK_MESSAGES.DELETE_SUCCESS,
      logSource
    });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({
      res,
      req,
      message: messages.FEEDBACK_MESSAGES.DELETE_ERROR,
      logSource
    });
  }
};
