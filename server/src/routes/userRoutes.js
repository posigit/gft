const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes - must be authenticated
router.use(protect);

// All user management routes require SUPER_ADMIN privileges
router.use(authorize("SUPER_ADMIN"));

// Get all users and create new user
router.route("/").get(getUsers).post(createUser);

// Get, update, and delete specific user
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router; 