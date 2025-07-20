const { protect, authorize, hotelAccess } = require("./authMiddleware");
const { notFound, errorHandler } = require("./errorMiddleware");

module.exports = {
  protect,
  authorize,
  hotelAccess,
  notFound,
  errorHandler,
};
