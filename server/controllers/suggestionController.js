const Suggestion = require('../models/suggestion');
const Category = require('../models/category');

// Create a new suggestion
const createSuggestion = async (req, res, next) => {
  const { type, name_he, name_en, parent_category_id, reason } = req.body;

  // If type is service, verify that parent_category_id exists
  if (type === 'service' && parent_category_id) {
    const categoryExists = await Category.findById(parent_category_id);
    if (!categoryExists) {
      return next(new AppError('Parent category not found', 404));
    }
  }

  // Create suggestion
  const suggestion = await Suggestion.create({
    type,
    name_he,
    name_en,
    parent_category_id: type === 'service' ? parent_category_id : undefined,
    reason,
    user: req.user ? req.user._id : undefined
  });

  res.status(201).json({
    status: 'success',
    data: suggestion
  });
};

// Get all suggestions (admin only)
const getAllSuggestions = async (req, res, next) => {
  const suggestions = await Suggestion.find()
    .populate('user', 'firstName lastName email')
    .populate('parent_category_id', 'name_he name_en');

  res.status(200).json({
    status: 'success',
    results: suggestions.length,
    data: suggestions
  });
};

// Get suggestion by ID (admin only)
const getSuggestion = async (req, res, next) => {
  const suggestion = await Suggestion.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('parent_category_id', 'name_he name_en');

  if (!suggestion) {
    return next(new AppError('No suggestion found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: suggestion
  });
};

// Update suggestion status (admin only)
const updateSuggestionStatus = async (req, res, next) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
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
    return next(new AppError('No suggestion found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: suggestion
  });
};

// Delete suggestion (admin only)
const deleteSuggestion = async (req, res, next) => {
  const suggestion = await Suggestion.findByIdAndDelete(req.params.id);

  if (!suggestion) {
    return next(new AppError('No suggestion found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
};

// Get user's suggestions
const getUserSuggestions = async (req, res, next) => {
  const suggestions = await Suggestion.find({ user: req.user._id })
    .populate('parent_category_id', 'name_he name_en');

  res.status(200).json({
    status: 'success',
    results: suggestions.length,
    data: suggestions
  });
};

module.exports = {
  createSuggestion,
  getAllSuggestions,
  getSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  getUserSuggestions
}; 