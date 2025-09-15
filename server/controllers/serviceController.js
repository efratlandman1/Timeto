const Service = require('../models/service');
const mongoose = require('mongoose');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require("@sentry/node");
const messages = require("../messages");

// קבלת כל השירותים
exports.getAllServices = async (req, res) => {
  const logSource = 'serviceController.getAllServices';
  const meta = getRequestMeta(req, logSource);
  
  logger.info({ ...meta }, `${logSource} enter`);
  
  try {
    const services = await Service.find({});
    logger.info({ ...meta, count: services.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { services },
      message: messages.SERVICE_MESSAGES.GET_ALL_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SERVICE_MESSAGES.GET_ALL_ERROR,
      logSource
    });
  }
};

// קבלת שירותים לפי קטגוריה
exports.getServicesByCategory = async (req, res) => {
  const logSource = 'serviceController.getServicesByCategory';
  const meta = getRequestMeta(req, logSource);
  const { categoryId } = req.params;
  
  logger.info({ ...meta, categoryId }, `${logSource} enter`);
  
  try {
    // בדיקת תקפות של categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      logger.warn({ ...meta, categoryId }, messages.SERVICE_MESSAGES.INVALID_CATEGORY_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: messages.SERVICE_MESSAGES.INVALID_CATEGORY_ID,
        logSource
      });
    }

    const services = await Service.find({ categoryId, active: true });
    logger.info({ ...meta, categoryId, count: services.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { services },
      message: messages.SERVICE_MESSAGES.GET_BY_CATEGORY_SUCCESS,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SERVICE_MESSAGES.GET_BY_CATEGORY_ERROR,
      logSource
    });
  }
};

// יצירת שירות חדש
exports.createService = async (req, res) => {
  const logSource = 'serviceController.createService';
  const meta = getRequestMeta(req, logSource);
  const { categoryId, name, active } = req.body;
  
  logger.info({ ...meta }, `${logSource} enter`);
  
  try {
    const newService = new Service({ categoryId, name, active });
    await newService.save();
    
    logger.info({ ...meta, serviceId: newService._id }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { service: newService },
      message: messages.SERVICE_MESSAGES.CREATE_SUCCESS,
      status: 201,
      logSource
    });
  } catch (error) {
    logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
    Sentry.captureException(error);
    return errorResponse({
      res,
      req,
      message: messages.SERVICE_MESSAGES.CREATE_ERROR,
      logSource
    });
  }
};

// עדכון שירות
exports.updateService = async (req, res) => {
    const logSource = 'serviceController.updateService';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta, serviceId: req.params.id }, `${logSource} enter`);
    
    try {
        const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedService) {
            logger.warn({ ...meta, serviceId: req.params.id }, messages.SERVICE_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.SERVICE_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        logger.info({ ...meta, serviceId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            data: { service: updatedService },
            message: messages.SERVICE_MESSAGES.UPDATE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.SERVICE_MESSAGES.UPDATE_ERROR,
            logSource
        });
    }
};

// מחיקת שירות
exports.deleteService = async (req, res) => {
    const logSource = 'serviceController.deleteService';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta, serviceId: req.params.id }, `${logSource} enter`);
    
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
        if (!deletedService) {
            logger.warn({ ...meta, serviceId: req.params.id }, messages.SERVICE_MESSAGES.NOT_FOUND);
            return errorResponse({
                res,
                req,
                status: 404,
                message: messages.SERVICE_MESSAGES.NOT_FOUND,
                logSource
            });
        }
        
        logger.info({ ...meta, serviceId: req.params.id }, `${logSource} complete`);
        return successResponse({
            res,
            req,
            message: messages.SERVICE_MESSAGES.DELETE_SUCCESS,
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: messages.SERVICE_MESSAGES.DELETE_ERROR,
            logSource
        });
    }
};
