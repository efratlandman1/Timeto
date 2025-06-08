const express = require('express');
const usersController = require("../controllers/usersController");
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth'); // Import the admin middleware

// The user registration route is handled by authController
// and defined in authRoutes.js. This route here can be used
// for admin purposes if needed, but we will focus on update/delete.

// router.post('/register', usersController.saveUser); // This was in the original file
router.post('/register', usersController.registerUser); 

// All other user management routes are for admins only
router.get('/', adminAuth, usersController.getAllUsers);
router.put('/:id', adminAuth, usersController.updateUser);
router.delete('/:id', adminAuth, usersController.deleteUser);

module.exports = router;
