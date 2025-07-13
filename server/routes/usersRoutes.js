const express = require('express');
const usersController = require("../controllers/usersController");
const router = express.Router();
const { requireAdmin, requireAuth } = require('../middlewares/authMiddleware'); // Import the new admin middleware

// The user registration route is handled by authController
// and defined in authRoutes.js. This route here can be used
// for admin purposes if needed, but we will focus on update/delete.

// router.post('/register', usersController.saveUser); // This was in the original file
// router.post('/register', usersController.registerUser); //update to register by auth

// All other user management routes are for admins only
router.get('/', requireAdmin, usersController.getAllUsers);
router.put('/:id', requireAuth, usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);

module.exports = router;
