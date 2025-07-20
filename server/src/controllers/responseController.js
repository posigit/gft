const asyncHandler = require("express-async-handler");
const Response = require("../models/Response");
const Feedback = require("../models/Feedback");

/**
 * @desc    Add response to feedback
 * @route   POST /api/feedback/:id/responses
 * @access  Private
 */
const addResponse = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const feedbackId = req.params.id;

  // Check if feedback exists
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Check if user has access to this feedback (for hotel admins)
  if (
    req.user.role === "HOTEL_ADMIN" &&
    feedback.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to respond to this feedback");
  }

  // Create response
  const response = await Response.create({
    feedback: feedbackId,
    respondedBy: req.user._id,
    message,
  });

  // Update feedback status to "In Progress" if it's currently "Pending"
  if (feedback.status === "Pending") {
    feedback.status = "In Progress";
    await feedback.save();
  }

  res.status(201).json({
    success: true,
    data: response,
    error: null,
  });
});

/**
 * @desc    Get responses for a feedback
 * @route   GET /api/feedback/:id/responses
 * @access  Private
 */
const getResponses = asyncHandler(async (req, res) => {
  const feedbackId = req.params.id;

  // Check if feedback exists
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Check if user has access to this feedback (for hotel admins)
  if (
    req.user.role === "HOTEL_ADMIN" &&
    feedback.hotel.toString() !== req.user.hotel.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view responses for this feedback");
  }

  // Get responses for the feedback
  const responses = await Response.find({ feedback: feedbackId })
    .populate("respondedBy", "firstName lastName role")
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: responses,
    error: null,
  });
});

/**
 * @desc    Update a response
 * @route   PUT /api/responses/:id
 * @access  Private
 */
const updateResponse = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const responseId = req.params.id;

  // Find the response
  const response = await Response.findById(responseId).populate("feedback");

  if (!response) {
    res.status(404);
    throw new Error("Response not found");
  }

  // Check if user is the author of the response
  if (response.respondedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this response");
  }

  // Update response
  response.message = message;
  response.isEdited = true;

  const updatedResponse = await response.save();

  res.json({
    success: true,
    data: updatedResponse,
    error: null,
  });
});

/**
 * @desc    Delete a response
 * @route   DELETE /api/responses/:id
 * @access  Private
 */
const deleteResponse = asyncHandler(async (req, res) => {
  const responseId = req.params.id;

  // Find the response
  const response = await Response.findById(responseId);

  if (!response) {
    res.status(404);
    throw new Error("Response not found");
  }

  // Check if user is the author of the response or a Super Admin
  if (
    response.respondedBy.toString() !== req.user._id.toString() &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this response");
  }

  await response.deleteOne();

  res.json({
    success: true,
    data: { message: "Response removed" },
    error: null,
  });
});

module.exports = {
  addResponse,
  getResponses,
  updateResponse,
  deleteResponse,
};
