const jwt = require("jsonwebtoken");

/**
 * Generate access token for user
 * @param {string} userId - User ID to include in token
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

/**
 * Generate refresh token for user
 * @param {string} userId - User ID to include in token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
