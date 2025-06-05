const express = require('express');
const usersController = require("../controllers/usersController");
const router = express.Router();

// The user registration route is handled by authController
// and defined in authRoutes.js. This route here can be used
// for admin purposes if needed, but we will focus on update/delete.

router.post('/register', usersController.saveUser); // This was in the original file
router.get('/', usersController.getAllUsers);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
