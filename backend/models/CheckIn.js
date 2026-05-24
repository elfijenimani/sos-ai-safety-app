const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Check-in title is required"],
      trim: true,
    },

    destinationName: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
    },

    destinationAddress: {
      type: String,
      default: "",
      trim: true,
    },

    destinationLatitude: {
      type: Number,
      required: [true, "Destination latitude is required"],
    },

    destinationLongitude: {
      type: Number,
      required: [true, "Destination longitude is required"],
    },

    expectedArrivalTime: {
      type: Date,
      required: [true, "Expected arrival time is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Completed", "Missed", "Cancelled"],
      default: "Active",
    },

    safetyMessage: {
      type: String,
      default: "I am starting a safety check-in.",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    missedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CheckIn", checkInSchema);