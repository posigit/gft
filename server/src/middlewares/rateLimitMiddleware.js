const rateLimit = require("express-rate-limit");

/**
 * Standard API rate limiter - 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    data: null,
    error: "Too many requests, please try again later.",
  },
});

/**
 * Auth rate limiter - 10 requests per 15 minutes
 * More strict for login attempts to prevent brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: "Too many authentication attempts, please try again later.",
  },
});

/**
 * Public feedback submission limiter - 20 requests per hour
 */
const feedbackRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: "Too many feedback submissions, please try again later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  feedbackRateLimiter,
};
