const express = require("express");
const {
  updateResponse,
  deleteResponse,
} = require("../controllers/responseController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Update and delete responses
router.route("/:id").put(updateResponse).delete(deleteResponse);

module.exports = router;
