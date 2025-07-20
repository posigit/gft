const express = require("express");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all categories and create new category
router.route("/").get(getCategories).post(createCategory);

// Get, update, and delete specific category
router
  .route("/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
