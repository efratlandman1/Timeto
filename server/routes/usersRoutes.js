const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { writeLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const { sanitizeRequest, validateUser, validateMongoIdParam } = require('../middlewares/inputValidation');

// The user registration route is handled by authController
// and defined in authRoutes.js. This route here can be used
// for admin purposes if needed, but we will focus on update/delete.

// router.post('/register', usersController.saveUser); // This was in the original file
// router.post('/register', usersController.registerUser); //update to register by auth

// All other user management routes are for admins only
router.get('/', requireAdmin, generalLimiter, sanitizeRequest, usersController.getAllUsers);
router.put('/:id', requireAuth, writeLimiter, sanitizeRequest, validateUser, validateMongoIdParam('id', 'User ID'), usersController.updateUser);
router.delete('/:id', requireAdmin, writeLimiter, usersController.deleteUser);

module.exports = router;
