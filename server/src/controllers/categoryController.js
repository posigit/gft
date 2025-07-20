const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Hotel = require("../models/Hotel");

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const { hotel } = req.query;
  const query = {};

  // If hotel ID is provided, fetch categories for that hotel or global categories
  if (hotel) {
    query.$or = [{ hotel }, { hotel: null }];
  }
  // For hotel admins, automatically filter by their hotel
  else if (req.user.role === "HOTEL_ADMIN") {
    query.$or = [{ hotel: req.user.hotel }, { hotel: null }];
  }

  const categories = await Category.find(query)
    .populate("hotel", "name location")
    .sort({ name: 1 });

  res.json({
    success: true,
    data: categories,
    error: null,
  });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "hotel",
    "name location"
  );

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if hotel admin has access to this category
  if (
    req.user.role === "HOTEL_ADMIN" &&
    category.hotel &&
    category.hotel._id.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to access this category");
  }

  res.json({
    success: true,
    data: category,
    error: null,
  });
});

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, hotel } = req.body;

  // Check if category with same name already exists
  const categoryExists = await Category.findOne({
    name,
    $or: [{ hotel }, { hotel: null }],
  });

  if (categoryExists) {
    res.status(400);
    throw new Error(
      `Category with name "${name}" already exists ${
        hotel ? "for this hotel" : "as a global category"
      }`
    );
  }

  // If hotel is specified, verify it exists
  if (hotel) {
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    // If hotel admin, ensure they can only create categories for their hotel
    if (
      req.user.role === "HOTEL_ADMIN" &&
      hotel.toString() !== req.user.hotel.toString()
    ) {
      res.status(403);
      throw new Error(
        "Not authorized to create categories for other hotels"
      );
    }
  }

  // Set hotel to user's hotel for hotel admins if not specified
  const hotelId = hotel || (req.user.role === "HOTEL_ADMIN" ? req.user.hotel : null);

  const category = await Category.create({
    name,
    description,
    hotel: hotelId,
  });

  res.status(201).json({
    success: true,
    data: category,
    error: null,
  });
});

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if user has permission to update this category
  if (
    req.user.role === "HOTEL_ADMIN" &&
    category.hotel &&
    category.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to update this category");
  }

  // Global categories can only be updated by super admins
  if (!category.hotel && req.user.role !== "SUPER_ADMIN") {
    res.status(403);
    throw new Error("Only Super Admins can update global categories");
  }

  // Check if name is being changed and if it would create a duplicate
  if (name && name !== category.name) {
    const duplicateCategory = await Category.findOne({
      name,
      $or: [{ hotel: category.hotel }, { hotel: null }],
      _id: { $ne: category._id },
    });

    if (duplicateCategory) {
      res.status(400);
      throw new Error(
        `Category with name "${name}" already exists ${
          category.hotel ? "for this hotel" : "as a global category"
        }`
      );
    }
  }

  // Update category fields
  category.name = name || category.name;
  category.description = description || category.description;

  const updatedCategory = await category.save();

  res.json({
    success: true,
    data: updatedCategory,
    error: null,
  });
});

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if user has permission to delete this category
  if (
    req.user.role === "HOTEL_ADMIN" &&
    category.hotel &&
    category.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this category");
  }

  // Global categories can only be deleted by super admins
  if (!category.hotel && req.user.role !== "SUPER_ADMIN") {
    res.status(403);
    throw new Error("Only Super Admins can delete global categories");
  }

  await category.deleteOne();

  res.json({
    success: true,
    data: { message: "Category removed" },
    error: null,
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}; 