const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Hotel location is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Hotel address is required"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrCodeUrl: {
      type: String,
    },
    managedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for feedback related to this hotel
hotelSchema.virtual("feedback", {
  ref: "Feedback",
  localField: "_id",
  foreignField: "hotel",
});

const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;
