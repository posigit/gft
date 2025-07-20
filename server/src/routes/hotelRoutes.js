const express = require("express");
const {
  getHotels,
  getPublicHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  generateHotelQRCode,
} = require("../controllers/hotelController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public route - no authentication required
router.get("/public", getPublicHotels);

// Protect all other routes - must be authenticated
router.use(protect);

// Get all hotels - Both Super Admin and Hotel Admin can access
router.route("/").get(getHotels);

// Get hotel by ID - Both Super Admin and Hotel Admin can access
router.route("/:id").get(getHotelById);

// Create hotel - Super Admin only
router.route("/").post(authorize("SUPER_ADMIN"), createHotel);

// Update hotel - Super Admin only
router.route("/:id").put(authorize("SUPER_ADMIN"), updateHotel);

// Delete hotel - Super Admin only
router.route("/:id").delete(authorize("SUPER_ADMIN"), deleteHotel);

// Generate QR code - Super Admin only
router.route("/:id/qrcode").post(authorize("SUPER_ADMIN"), generateHotelQRCode);

module.exports = router;
