const express = require("express");
const router = express.Router();
const {
  login,
  registerUser,
  refreshToken,
  logout,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  validate,
  userSchemas,
} = require("../middlewares/validationMiddleware");

// Public routes
router.post("/login", validate(userSchemas.login), login);
router.post("/refresh", validate(userSchemas.refresh), refreshToken);

// Private routes
router.post(
  "/register",
  protect,
  authorize(["SUPER_ADMIN"]),
  validate(userSchemas.register),
  registerUser
);
router.post("/logout", protect, logout);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, validate(userSchemas.updateProfile), updateUserProfile);

module.exports = router;
