const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const {
  apiLimiter,
  authLimiter,
} = require("./middlewares/rateLimitMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const responseRoutes = require("./routes/responseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
   origin: [
       "http://localhost:3000",
            "https://gft-posigits-projects.vercel.app",
            "https://gft-git-main-posigits-projects.vercel.app",
            "https://gft-xi.vercel.app"
  ],
  credentials: true
}));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:"],
      },
    },
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Apply rate limiting to all requests
app.use(apiLimiter);

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Presken Guest Feedback Tracker API" });
});

// Use routes with specific rate limiters
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Initialize server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
});

module.exports = app;
