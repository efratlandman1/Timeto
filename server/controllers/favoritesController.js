const Favorite = require("../models/favorite");
const AuthUtils = require('../utils/authUtils');
const mongoose = require('mongoose');

// Toggle favorite status for a business
exports.toggleFavorite = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);

    if (!userId) {
      return res.status(401).json({ error: "לא זוהתה הרשאה תקינה. אנא התחבר מחדש." });
    }

    const { business_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(business_id)) {
      return res.status(400).json({ error: "מספר עסק לא תקין." });
    }

    // Try to find existing favorite
    let favorite = await Favorite.findOne({
      user_id: userId,
      business_id: business_id
    });

    if (favorite) {
      // Toggle active status if exists
      favorite.active = !favorite.active;
      await favorite.save();
    } else {
      // Create new favorite if doesn't exist
      favorite = new Favorite({
        user_id: userId,
        business_id: business_id,
        active: true
      });
      await favorite.save();
    }

    res.status(200).json({ 
      message: favorite.active ? "העסק נוסף למועדפים" : "העסק הוסר מהמועדפים",
      active: favorite.active 
    });

  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: "שגיאה בעת עדכון המועדפים." });
  }
};

// Get all favorite businesses for a user
exports.getUserFavorites = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);

    if (!userId) {
      return res.status(401).json({ error: "לא זוהתה הרשאה תקינה. אנא התחבר מחדש." });
    }

    const favorites = await Favorite.find({ 
      user_id: userId,
      active: true 
    })
    .populate({
      path: 'business_id',
      select: 'name address prefix phone email logo rating categoryId services active',
      populate: [
        { path: 'categoryId', select: 'name' },
        { path: 'services', select: 'name' }
      ]
    })
    .sort({ created_at: -1 });

    // Transform the data to match the expected format
    const businesses = favorites.map(fav => fav.business_id);

    res.json(businesses);
  } catch (err) {
    console.error('Error fetching favorites:', err); 
    res.status(500).json({ error: "שגיאה בטעינת המועדפים." });
  }
};

// Check if a business is favorited by the user
exports.checkFavoriteStatus = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = AuthUtils.extractUserId(token);
    const businessId = req.params.businessId;

    if (!userId) {
      return res.status(401).json({ error: "לא זוהתה הרשאה תקינה." });
    }

    const favorite = await Favorite.findOne({
      user_id: userId,
      business_id: businessId
    });

    res.json({ 
      isFavorite: favorite ? favorite.active : false 
    });

  } catch (err) {
    console.error('Error checking favorite status:', err);
    res.status(500).json({ error: "שגיאה בבדיקת סטטוס מועדפים." });
  }
}; 