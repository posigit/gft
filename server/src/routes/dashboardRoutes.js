const express = require("express");
const {
  getDashboardStats,
  getFeedbackTrends,
  getHotelsComparison,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible by both Super Admin and Hotel Admin
router.get("/stats", getDashboardStats);
router.get("/trends", getFeedbackTrends);

// Routes accessible only by Super Admin
router.get(
  "/hotels-comparison",
  authorize("SUPER_ADMIN"),
  getHotelsComparison
);

module.exports = router; 