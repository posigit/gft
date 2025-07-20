const asyncHandler = require("express-async-handler");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

/**
 * @desc    Get all hotels
 * @route   GET /api/hotels
 * @access  Private
 */
const getHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({}).sort({ name: 1 });

  res.json({
    success: true,
    data: hotels,
    error: null,
  });
});

/**
 * @desc    Get active hotels for public feedback form
 * @route   GET /api/hotels/public
 * @access  Public
 */
const getPublicHotels = asyncHandler(async (req, res) => {
  // Only return active hotels with basic info needed for the feedback form
  const hotels = await Hotel.find({ isActive: true })
    .select("_id name location")
    .sort({ name: 1 });

  res.json({
    success: true,
    data: hotels,
    error: null,
  });
});

/**
 * @desc    Get hotel by ID
 * @route   GET /api/hotels/:id
 * @access  Private
 */
const getHotelById = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    res.json({
      success: true,
      data: hotel,
      error: null,
    });
  } else {
    res.status(404);
    throw new Error("Hotel not found");
  }
});

/**
 * @desc    Create a new hotel
 * @route   POST /api/hotels
 * @access  Private/SuperAdmin
 */
const createHotel = asyncHandler(async (req, res) => {
  const { name, location, address, contactEmail, contactPhone, adminPassword } =
    req.body;

  // Check if hotel with same name already exists
  const hotelExists = await Hotel.findOne({ name });
  if (hotelExists) {
    res.status(400);
    throw new Error("Hotel with this name already exists");
  }

  // Check if user with the contact email already exists
  if (adminPassword) {
    const userExists = await User.findOne({ email: contactEmail });
    if (userExists) {
      res.status(400);
      throw new Error("User with this email already exists");
    }
  }

  // Create the hotel
  const hotel = await Hotel.create({
    name,
    location,
    address,
    contactEmail,
    contactPhone,
  });

  if (hotel) {
    // If adminPassword is provided, create a hotel admin account
    if (adminPassword) {
      try {
        const user = await User.create({
          firstName: name.split(" ")[0] || "Admin",
          lastName: name.split(" ").slice(1).join(" ") || "User",
          email: contactEmail,
          password: adminPassword,
          role: "HOTEL_ADMIN",
          hotel: hotel._id,
        });

        if (user) {
          // Add user to hotel's managedBy array
          hotel.managedBy.push(user._id);
          await hotel.save();
        }
      } catch (error) {
        // If user creation fails, still return the hotel but with a warning
        return res.status(201).json({
          success: true,
          data: hotel,
          error:
            "Hotel created but failed to create admin account: " +
            error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: hotel,
      error: null,
    });
  } else {
    res.status(400);
    throw new Error("Invalid hotel data");
  }
});

/**
 * @desc    Update a hotel
 * @route   PUT /api/hotels/:id
 * @access  Private/SuperAdmin
 */
const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    hotel.name = req.body.name || hotel.name;
    hotel.location = req.body.location || hotel.location;
    hotel.address = req.body.address || hotel.address;
    hotel.contactEmail = req.body.contactEmail || hotel.contactEmail;
    hotel.contactPhone = req.body.contactPhone || hotel.contactPhone;
    hotel.isActive =
      req.body.isActive !== undefined ? req.body.isActive : hotel.isActive;

    const updatedHotel = await hotel.save();

    res.json({
      success: true,
      data: updatedHotel,
      error: null,
    });
  } else {
    res.status(404);
    throw new Error("Hotel not found");
  }
});

/**
 * @desc    Delete a hotel
 * @route   DELETE /api/hotels/:id
 * @access  Private/SuperAdmin
 */
const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    // Check if hotel has any associated admins
    const hotelAdmins = await User.find({ hotel: hotel._id });

    if (hotelAdmins.length > 0) {
      res.status(400);
      throw new Error(
        "Cannot delete hotel with associated admins. Please reassign or delete admins first."
      );
    }

    await hotel.deleteOne();

    res.json({
      success: true,
      data: { message: "Hotel removed" },
      error: null,
    });
  } else {
    res.status(404);
    throw new Error("Hotel not found");
  }
});

/**
 * @desc    Generate QR code for a hotel
 * @route   POST /api/hotels/:id/qrcode
 * @access  Private/SuperAdmin
 */
const generateHotelQRCode = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    res.status(404);
    throw new Error("Hotel not found");
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, "../../uploads/qrcodes");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Define feedback URL with hotel ID pre-populated
  const feedbackUrl = `${req.protocol}://${req.get("host")}/feedback?hotel=${
    hotel._id
  }`;

  // Generate QR code - first as a data URL
  const qrCodeDataUrl = await QRCode.toDataURL(feedbackUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    color: {
      dark: "#000",
      light: "#FFF",
    },
  });

  // Save to file
  const qrCodeFileName = `hotel_${hotel._id}_qrcode.png`;
  const qrCodeFilePath = path.join(uploadsDir, qrCodeFileName);

  // Convert data URL to buffer and save
  const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
  fs.writeFileSync(qrCodeFilePath, qrCodeBuffer);

  // Create public URL for the QR code
  const qrCodeUrl = `${req.protocol}://${req.get(
    "host"
  )}/uploads/qrcodes/${qrCodeFileName}`;

  // Update hotel with QR code URL
  hotel.qrCodeUrl = qrCodeUrl;
  await hotel.save();

  res.json({
    success: true,
    data: {
      qrCodeUrl: hotel.qrCodeUrl,
      feedbackUrl,
    },
    error: null,
  });
});

module.exports = {
  getHotels,
  getPublicHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  generateHotelQRCode,
};
 