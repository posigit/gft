const asyncHandler = require("express-async-handler");
const Feedback = require("../models/Feedback");
const Hotel = require("../models/Hotel");

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const { hotel, startDate, endDate } = req.query;

  // Build base query
  const query = {};

  // Apply hotel filter for super admin, or force hotel for hotel admin
  if (req.user.role === "HOTEL_ADMIN") {
    query.hotel = req.user.hotel;
  } else if (hotel) {
    query.hotel = hotel;
  }

  // Apply date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Get total counts
  const totalFeedback = await Feedback.countDocuments(query);

  // Get counts by type
  const typeQuery = { ...query };
  const complaintCount = await Feedback.countDocuments({
    ...typeQuery,
    feedbackType: "Complaint",
  });
  const suggestionCount = await Feedback.countDocuments({
    ...typeQuery,
    feedbackType: "Suggestion",
  });
  const praiseCount = await Feedback.countDocuments({
    ...typeQuery,
    feedbackType: "Praise",
  });

  // Get counts by status
  const statusQuery = { ...query };
  const pendingCount = await Feedback.countDocuments({
    ...statusQuery,
    status: "Pending",
  });
  const inProgressCount = await Feedback.countDocuments({
    ...statusQuery,
    status: "In Progress",
  });
  const resolvedCount = await Feedback.countDocuments({
    ...statusQuery,
    status: "Resolved",
  });
  const escalatedCount = await Feedback.countDocuments({
    ...statusQuery,
    status: "Escalated",
  });

  // Get average rating
  const ratingResult = await Feedback.aggregate([
    { $match: query },
    { $group: { _id: null, average: { $avg: "$rating" } } },
  ]);
  const averageRating = ratingResult.length > 0 ? ratingResult[0].average : 0;

  // Get recent feedback (last 5)
  const recentFeedback = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("hotel", "name location")
    .lean();

  // Format feedback for frontend
  const formattedFeedback = recentFeedback.map((feedback) => ({
    id: feedback._id.toString(),
    hotelId: feedback.hotel._id ? feedback.hotel._id.toString() : undefined,
    hotelName: feedback.hotel.name,
    guestName: feedback.guestName,
    roomNumber: feedback.roomNumber,
    type: feedback.feedbackType.toUpperCase(),
    message: feedback.message,
    status: feedback.status.toUpperCase().replace(" ", "_"),
    rating: feedback.rating,
    createdAt: feedback.createdAt,
  }));

  res.json({
    success: true,
    data: {
      totalFeedback,
      pendingCount,
      resolvedCount,
      byType: {
        complaint: complaintCount,
        suggestion: suggestionCount,
        praise: praiseCount,
      },
      byStatus: {
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        escalated: escalatedCount,
      },
      averageRating: parseFloat(averageRating.toFixed(1)),
      recentFeedback: formattedFeedback,
    },
    error: null,
  });
});

/**
 * @desc    Get feedback trend data
 * @route   GET /api/dashboard/trends
 * @access  Private
 */
const getFeedbackTrends = asyncHandler(async (req, res) => {
  const { hotel, period = "monthly", limit = 6, startDate, endDate } = req.query;

  // Build base query
  const query = {};

  // Apply hotel filter for super admin, or force hotel for hotel admin
  if (req.user.role === "HOTEL_ADMIN") {
    query.hotel = req.user.hotel;
  } else if (hotel) {
    query.hotel = hotel;
  }

  // Apply date range filter if provided
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Determine grouping format based on period
  let dateFormat;
  let dateField;
  let sortField;
  
  // Set effective period and limit based on date range
  let effectivePeriod = period;
  let effectiveLimit = parseInt(limit);
  
  // If date range is provided, force daily period and increase limit
  if (startDate && endDate) {
    effectivePeriod = "daily";
    // Calculate days between dates to ensure we get all days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    effectiveLimit = Math.max(daysDiff, parseInt(limit));
    console.log(`Using daily period with limit ${effectiveLimit} for date range ${startDate} to ${endDate}`);
  }

  switch (effectivePeriod) {
    case "daily":
      dateFormat = "%Y-%m-%d";
      dateField = { $dateToString: { format: dateFormat, date: "$createdAt" } };
      sortField = "_id";
      break;
    case "weekly":
      dateFormat = "%Y-W%U"; // Year-Week format
      dateField = { $dateToString: { format: dateFormat, date: "$createdAt" } };
      sortField = "_id";
      break;
    case "monthly":
    default:
      dateFormat = "%Y-%m";
      dateField = { $dateToString: { format: dateFormat, date: "$createdAt" } };
      sortField = "_id";
  }

  // Get trend data for total feedback
  const totalTrend = await Feedback.aggregate([
    { $match: query },
    {
      $group: {
        _id: dateField,
        count: { $sum: 1 },
        complaint: {
          $sum: { $cond: [{ $eq: ["$feedbackType", "Complaint"] }, 1, 0] },
        },
        suggestion: {
          $sum: { $cond: [{ $eq: ["$feedbackType", "Suggestion"] }, 1, 0] },
        },
        praise: {
          $sum: { $cond: [{ $eq: ["$feedbackType", "Praise"] }, 1, 0] },
        },
        averageRating: { $avg: "$rating" },
      },
    },
    { $sort: { [sortField]: -1 } },
    { $limit: effectiveLimit },
    { $sort: { [sortField]: 1 } },
  ]);

  // Format data for frontend charts
  const labels = totalTrend.map((item) => item._id);
  const totalData = totalTrend.map((item) => item.count);
  const complaintData = totalTrend.map((item) => item.complaint);
  const suggestionData = totalTrend.map((item) => item.suggestion);
  const praiseData = totalTrend.map((item) => item.praise);
  const ratingData = totalTrend.map((item) =>
    parseFloat(item.averageRating.toFixed(1))
  );

  res.json({
    success: true,
    data: {
      labels,
      datasets: {
        total: totalData,
        complaint: complaintData,
        suggestion: suggestionData,
        praise: praiseData,
        averageRating: ratingData,
      },
    },
    error: null,
  });
});

/**
 * @desc    Get hotel performance comparison
 * @route   GET /api/dashboard/hotels-comparison
 * @access  Private/SuperAdmin
 */
const getHotelsComparison = asyncHandler(async (req, res) => {
  // Only Super Admin can access this endpoint
  if (req.user.role !== "SUPER_ADMIN") {
    res.status(403);
    throw new Error("Not authorized to access hotel comparison data");
  }

  const { startDate, endDate, limit = 10 } = req.query;

  // Build base query
  const query = {};

  // Apply date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Get hotel comparison data
  const hotelComparison = await Feedback.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$hotel",
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        complaintCount: {
          $sum: { $cond: [{ $eq: ["$feedbackType", "Complaint"] }, 1, 0] },
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "hotels",
        localField: "_id",
        foreignField: "_id",
        as: "hotelInfo",
      },
    },
    { $unwind: "$hotelInfo" },
    {
      $addFields: {
        resolutionRate: {
          $cond: [
            { $eq: ["$totalFeedback", 0] },
            0,
            { $divide: ["$resolvedCount", "$totalFeedback"] },
          ],
        },
      },
    },
    { $sort: { totalFeedback: -1 } },
    { $limit: parseInt(limit) },
    {
      $project: {
        _id: 1,
        hotelName: "$hotelInfo.name",
        location: "$hotelInfo.location",
        totalFeedback: 1,
        averageRating: 1,
        complaintCount: 1,
        resolvedCount: 1,
        resolutionRate: 1,
      },
    },
  ]);

  // Format data for response
  const formattedData = hotelComparison.map((hotel) => ({
    id: hotel._id,
    name: hotel.hotelName,
    location: hotel.location,
    totalFeedback: hotel.totalFeedback,
    averageRating: parseFloat(hotel.averageRating.toFixed(1)),
    complaintCount: hotel.complaintCount,
    resolvedCount: hotel.resolvedCount,
    resolutionRate: parseFloat((hotel.resolutionRate * 100).toFixed(1)),
  }));

  res.json({
    success: true,
    data: formattedData,
    error: null,
  });
});

module.exports = {
  getDashboardStats,
  getFeedbackTrends,
  getHotelsComparison,
};
