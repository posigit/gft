const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Hotel = require("../models/Hotel");

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/SuperAdmin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate("hotel", "name location")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
    error: null,
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/SuperAdmin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "hotel",
    "name location"
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
 * @desc    Create a new user (hotel admin)
 * @route   POST /api/users
 * @access  Private/SuperAdmin
 */
const createUser = asyncHandler(async (req, res) => {
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

  // Check if hotel exists if provided
  if (hotel) {
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      res.status(404);
      throw new Error("Hotel not found");
    }
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
    // If user is a hotel admin, update the hotel's managedBy array
    if (role === "HOTEL_ADMIN" && hotel) {
      await Hotel.findByIdAndUpdate(hotel, {
        $addToSet: { managedBy: user._id },
      });
    }

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
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/SuperAdmin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { firstName, lastName, email, role, hotel, isActive } = req.body;

  // Handle hotel assignment changes for HOTEL_ADMIN
  const originalHotelId = user.hotel ? user.hotel.toString() : null;
  const newHotelId = hotel || null;
  const roleChanged = role && role !== user.role;
  const hotelChanged = newHotelId !== originalHotelId;

  // If changing from HOTEL_ADMIN to SUPER_ADMIN, remove from old hotel
  if (
    user.role === "HOTEL_ADMIN" &&
    originalHotelId &&
    (roleChanged || hotelChanged)
  ) {
    await Hotel.findByIdAndUpdate(originalHotelId, {
      $pull: { managedBy: user._id },
    });
  }

  // Update user fields
  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;

  if (role) {
    user.role = role;
  }

  // Set or clear hotel based on role
  if (role === "SUPER_ADMIN" || user.role === "SUPER_ADMIN") {
    user.hotel = undefined;
  } else if ((role === "HOTEL_ADMIN" || user.role === "HOTEL_ADMIN") && hotel) {
    // Verify hotel exists
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      res.status(404);
      throw new Error("Hotel not found");
    }
    user.hotel = hotel;
  }

  if (isActive !== undefined) {
    user.isActive = isActive;
  }

  const updatedUser = await user.save();

  // If user is now a hotel admin with a new hotel, add to the hotel's managedBy array
  if (updatedUser.role === "HOTEL_ADMIN" && updatedUser.hotel && hotelChanged) {
    await Hotel.findByIdAndUpdate(updatedUser.hotel, {
      $addToSet: { managedBy: updatedUser._id },
    });
  }

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      hotel: updatedUser.hotel,
      isActive: updatedUser.isActive,
    },
    error: null,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/SuperAdmin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // If deleting a hotel admin, remove from hotel's managedBy array
  if (user.role === "HOTEL_ADMIN" && user.hotel) {
    await Hotel.findByIdAndUpdate(user.hotel, {
      $pull: { managedBy: user._id },
    });
  }

  await user.deleteOne();

  res.json({
    success: true,
    data: { message: "User removed" },
    error: null,
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
