const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      trim: true,
      // Optional field
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    feedbackType: {
      type: String,
      enum: ["Complaint", "Suggestion", "Praise"],
      required: [true, "Feedback type is required"],
    },
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Escalated"],
      default: "Pending",
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    // Add a string field for storing staff name directly
    assignedToName: {
      type: String,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
