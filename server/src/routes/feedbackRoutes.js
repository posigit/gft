const express = require("express");
const {
  submitFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  updateFeedbackCategories,
} = require("../controllers/feedbackController");
const {
  addResponse,
  getResponses,
} = require("../controllers/responseController");
const { protect } = require("../middlewares/authMiddleware");
const { feedbackRateLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Public routes - no authentication required
router.post("/submit", feedbackRateLimiter, submitFeedback);

// Protected routes - authentication required
router.route("/").get(protect, getFeedback);
router.route("/:id").get(protect, getFeedbackById);
router.route("/:id/status").put(protect, updateFeedbackStatus);
router.route("/:id/categories").put(protect, updateFeedbackCategories);

// Response routes
router
  .route("/:id/responses")
  .get(protect, getResponses)
  .post(protect, addResponse);

module.exports = router;
