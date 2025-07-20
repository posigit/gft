const { protect, authorize, hotelAccess } = require("./authMiddleware");
const { notFound, errorHandler } = require("./errorMiddleware");

module.exports = {
  protect,
  authorize,
  hotelAccess,
  notFound,
  errorHandler,
};
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://gft-git-main-posigits-projects.vercel.app'] 
    : 'http://localhost:3000',
  credentials: true
}));
