const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

/**
 * Middleware to protect routes by verifying JWT
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id (without password)
      req.user = await User.findById(decoded.id).select(
        "-password -refreshToken"
      );

      // Check if user exists or is active
      if (!req.user || !req.user.isActive) {
        res.status(401);
        throw new Error("Not authorized, user not found or inactive");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

/**
 * Middleware to check if user has specified role
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, no user found");
    }

    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        "Forbidden: You do not have permission to perform this action"
      );
    }

    next();
  };
};

/**
 * Middleware to check if hotel admin is accessing only their assigned hotel
 * Applies only to hotel admins
 */
const hotelAccess = asyncHandler(async (req, res, next) => {
  // Skip for super admins
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }

  // For hotel admins, check if they are accessing their assigned hotel
  const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;

  if (!hotelId) {
    return next();
  }

  // Check if the hotel ID matches the assigned hotel
  if (req.user.hotel && req.user.hotel.toString() !== hotelId) {
    res.status(403);
    throw new Error("Forbidden: You can only access your assigned hotel");
  }

  next();
});

module.exports = { protect, authorize, hotelAccess };
