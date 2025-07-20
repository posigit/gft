const express = require("express");
const { exportToExcel, exportToPDF } = require("../controllers/exportController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Export routes
router.get("/excel", exportToExcel);
router.get("/pdf", exportToPDF);

module.exports = router; 