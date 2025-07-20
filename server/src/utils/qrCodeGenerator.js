const QRCode = require("qrcode");

/**
 * Generate a QR code for hotel feedback form
 * @param {string} baseUrl - Base URL of the feedback form
 * @param {string} hotelId - ID of the hotel
 * @returns {Promise<string>} - Data URL of the QR code
 */
const generateHotelQRCode = async (baseUrl, hotelId) => {
  // Create the URL with the hotel ID as a query parameter
  const feedbackUrl = `${baseUrl}?hotelId=${hotelId}`;

  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(feedbackUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: {
        dark: "#8A2BE2", // Purple color for the QR code
        light: "#FFFFFF", // White background
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

module.exports = { generateHotelQRCode };
