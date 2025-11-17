const Favorite = require("../models/favorite");
const mongoose = require('mongoose');
const logger = require('../logger');
const { captureError, errorResponse, successResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');
const { FAVORITES } = require('../messages');

// Toggle favorite status for a business
exports.toggleFavorite = async (req, res) => {
  const logSource = 'favoritesController.toggleFavorite';
  const meta = getRequestMeta(req, logSource);
  
  try {
    const { business_id } = req.body;
    logger.info({ ...meta, business_id }, `${logSource} enter`);

    if (!mongoose.Types.ObjectId.isValid(business_id)) {
      logger.warn({ ...meta, business_id }, FAVORITES.INVALID_BUSINESS_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: FAVORITES.INVALID_BUSINESS_ID,
        logSource
      });
    }

    let favorite = await Favorite.findOne({
      user_id: req.user._id,
      business_id: business_id
    });

    if (favorite) {
      favorite.active = !favorite.active;
      await favorite.save();
    } else {
      favorite = new Favorite({
        user_id: req.user._id,
        business_id: business_id,
        active: true
      });
      await favorite.save();
    }

    logger.info({ 
      ...meta, 
      business_id, 
      active: favorite.active 
    }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: {
        message: favorite.active ? FAVORITES.FAVORITE_ADDED : FAVORITES.FAVORITE_REMOVED,
        active: favorite.active
      },
      logSource
    });

  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    captureError(err, req);
    return errorResponse({
      res,
      req,
      status: 500,
      message: FAVORITES.ERROR_TOGGLE_FAVORITE,
      logSource
    });
  }
};

// Get user's favorites
exports.getUserFavorites = async (req, res) => {
  const logSource = 'favoritesController.getUserFavorites';
  const meta = getRequestMeta(req, logSource);
  
  try {
    logger.info({ ...meta, userId: req.user._id }, `${logSource} enter`);

    // Only favorites that point to active businesses
    let favorites = await Favorite.find({ 
      user_id: req.user._id,
      active: true 
    })
    .populate({
      path: 'business_id',
      select: 'name address prefix phone email logo rating categoryId services active',
      match: { active: true },
      populate: [
        { path: 'categoryId', select: 'name color logo' },
        { path: 'services', select: 'name' }
      ]
    })
    .sort({ createdAt: -1 });
    // Filter out favorites where the populated business is null (not active)
    favorites = favorites.filter(f => f.business_id);


    logger.info({ ...meta, userId: req.user._id, count: favorites.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { favorites },
      message: "המועדפים נטענו בהצלחה",
      logSource
    });

  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    captureError(err, req);
    return errorResponse({
      res,
      req,
      status: 500,
      message: FAVORITES.ERROR_FETCH_FAVORITES,
      logSource
    });
  }
};

// Check if business is favorited by user
exports.checkFavoriteStatus = async (req, res) => {
  const logSource = 'favoritesController.checkFavoriteStatus';
  const meta = getRequestMeta(req, logSource);
  
  try {
    const { business_id } = req.params;
    logger.info({ ...meta, business_id, userId: req.user._id }, `${logSource} enter`);

    if (!mongoose.Types.ObjectId.isValid(business_id)) {
      logger.warn({ ...meta, business_id }, FAVORITES.INVALID_BUSINESS_ID);
      return errorResponse({
        res,
        req,
        status: 400,
        message: FAVORITES.INVALID_BUSINESS_ID,
        logSource
      });
    }

    const favorite = await Favorite.findOne({
      user_id: req.user._id,
      business_id: business_id,
      active: true
    });

    logger.info({ ...meta, business_id, userId: req.user._id, isFavorited: !!favorite }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { 
        isFavorite: favorite ? favorite.active : false 
      },
      message: "סטטוס המועדפים נבדק בהצלחה",
      logSource
    });

  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    captureError(err, req);
    return errorResponse({
      res,
      req,
      status: 500,
      message: FAVORITES.ERROR_CHECK_FAVORITE_STATUS,
      logSource
    });
  }
};

exports.getFavorites = async (req, res) => {
  const logSource = 'favoritesController.getFavorites';
  const meta = getRequestMeta(req, logSource);
  
  try {
    logger.info({ ...meta }, `${logSource} enter`);
    
    const favorites = await Favorite.find({ user_id: req.params.userId, active: true })
      .populate('business_id')
      .sort({ createdAt: -1 });
      
    logger.info({ ...meta, count: favorites.length }, `${logSource} complete`);
    
    return successResponse({
      res,
      req,
      data: { favorites },
      logSource
    });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    captureError(err, req);
    return errorResponse({
      res,
      req,
      status: 500,
      message: FAVORITES.ERROR_FETCH_FAVORITES,
      logSource
    });
  }
}; 