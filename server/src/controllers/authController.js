const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists and password matches
  if (user && (await user.comparePassword(password))) {
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        hotel: user.hotel,
        accessToken,
        refreshToken,
      },
      error: null,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

/**
 * @desc    Register a new user (Admin only)
 * @route   POST /api/auth/register
 * @access  Private/SuperAdmin
 */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, hotel } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Validate hotel for hotel admin
  if (role === "HOTEL_ADMIN" && !hotel) {
    res.status(400);
    throw new Error("Hotel is required for Hotel Admin");
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    hotel: role === "HOTEL_ADMIN" ? hotel : undefined,
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        hotel: user.hotel,
      },
      error: null,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (with refresh token)
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token is required");
  }

  try {
    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });

    if (!user) {
      res.status(401);
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      error: null,
    });
  } catch (error) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }
});

/**
 * @desc    Logout user / clear refresh token
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token in database
  const user = await User.findById(req.user._id);

  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }

  res.json({
    success: true,
    data: { message: "Logged out successfully" },
    error: null,
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (user) {
    res.json({
      success: true,
      data: user,
      error: null,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      error: null,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = {
  login,
  registerUser,
  refreshToken,
  logout,
  getUserProfile,
  updateUserProfile,
};
