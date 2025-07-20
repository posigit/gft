const asyncHandler = require("express-async-handler");
const Feedback = require("../models/Feedback");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const Category = require("../models/Category");

/**
 * @desc    Submit public feedback
 * @route   POST /api/feedback/submit
 * @access  Public
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const {
    guestName,
    roomNumber,
    hotel,
    feedbackType,
    message,
    rating,
    categories,
  } = req.body;

  // Validate hotel exists
  const hotelExists = await Hotel.findById(hotel);
  if (!hotelExists) {
    res.status(404);
    throw new Error("Hotel not found");
  }

  // Get IP address and user agent for tracking
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  // Create feedback
  const feedback = await Feedback.create({
    guestName: guestName || "Anonymous Guest",
    roomNumber,
    hotel,
    feedbackType,
    message,
    rating,
    categories: categories || [],
    ipAddress,
    userAgent,
    isAnonymous: !guestName,
  });

  if (feedback) {
    res.status(201).json({
      success: true,
      data: { message: "Feedback submitted successfully" },
      error: null,
    });
  } else {
    res.status(400);
    throw new Error("Invalid feedback data");
  }
});

/**
 * @desc    Get all feedback (filtered by hotel for hotel admin)
 * @route   GET /api/feedback
 * @access  Private
 */
const getFeedback = asyncHandler(async (req, res) => {
  const {
    hotel,
    type,
    status,
    startDate,
    endDate,
    minRating,
    maxRating,
    page = 1,
    limit = 10,
  } = req.query;

  // Build query object
  const query = {};

  // Apply hotel filter - if HOTEL_ADMIN, force their hotel
  if (req.user.role === "HOTEL_ADMIN") {
    query.hotel = req.user.hotel;
  } else if (hotel) {
    // For SUPER_ADMIN, respect the hotel filter if provided
    query.hotel = hotel;
  }

  // Apply other filters
  if (type) query.feedbackType = type;
  if (status) query.status = status;
  if (minRating) query.rating = { $gte: Number(minRating) };
  if (maxRating) {
    if (query.rating) {
      query.rating.$lte = Number(maxRating);
    } else {
      query.rating = { $lte: Number(maxRating) };
    }
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const feedback = await Feedback.find(query)
    .populate("hotel", "name location")
    .populate("assignedTo", "firstName lastName")
    .populate("categories", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Get total count for pagination
  const total = await Feedback.countDocuments(query);

  res.json({
    success: true,
    data: {
      feedback,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    error: null,
  });
});

/**
 * @desc    Get feedback by ID
 * @route   GET /api/feedback/:id
 * @access  Private
 */
const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate("hotel", "name location")
    .populate("assignedTo", "firstName lastName")
    .populate("categories", "name");

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Check if user has access to this feedback
  if (
    req.user.role === "HOTEL_ADMIN" &&
    feedback.hotel._id.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to access this feedback");
  }

  res.json({
    success: true,
    data: feedback,
    error: null,
  });
});

/**
 * @desc    Update feedback status
 * @route   PUT /api/feedback/:id/status
 * @access  Private
 */
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status, assignedTo } = req.body;

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Check if user has access to this feedback
  if (
    req.user.role === "HOTEL_ADMIN" &&
    feedback.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to update this feedback");
  }

  // Update fields
  if (status) feedback.status = status;

  // Update the assignedToName field with the string value
  if (assignedTo) {
    feedback.assignedToName = assignedTo;
  }

  // Set resolved date if status is RESOLVED
  if (status === "RESOLVED" && feedback.status !== "RESOLVED") {
    feedback.resolvedAt = new Date();
  } else if (status !== "RESOLVED") {
    // Clear resolved date if status is changed from RESOLVED to something else
    feedback.resolvedAt = undefined;
  }

  const updatedFeedback = await feedback.save();

  res.json({
    success: true,
    data: updatedFeedback,
    error: null,
  });
});

/**
 * @desc    Update feedback categories
 * @route   PUT /api/feedback/:id/categories
 * @access  Private
 */
const updateFeedbackCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories)) {
    res.status(400);
    throw new Error("Categories must be provided as an array");
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Check if user has access to this feedback
  if (
    req.user.role === "HOTEL_ADMIN" &&
    feedback.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to update this feedback");
  }

  // Validate that all categories exist and are accessible to this user
  for (const categoryId of categories) {
    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404);
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    // Verify that hotel admin can only use global categories or categories for their hotel
    if (
      req.user.role === "HOTEL_ADMIN" &&
      category.hotel &&
      category.hotel.toString() !== req.user.hotel.toString()
    ) {
      res.status(403);
      throw new Error(`Not authorized to use category with ID ${categoryId}`);
    }
  }

  // Update feedback categories
  feedback.categories = categories;
  const updatedFeedback = await feedback.save();

  // Populate categories for response
  await updatedFeedback.populate("categories", "name");

  res.json({
    success: true,
    data: updatedFeedback,
    error: null,
  });
});

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  updateFeedbackCategories,
};
