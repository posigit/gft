const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
      required: [true, "Feedback reference is required"],
    },
    message: {
      type: String,
      required: [true, "Response message is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    isInternal: {
      type: Boolean,
      default: false,
      description:
        "If true, this response is only visible to staff, not to guests",
    },
  },
  {
    timestamps: true,
  }
);

const Response = mongoose.model("Response", responseSchema);

module.exports = Response;
