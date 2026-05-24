const mongoose = require("mongoose");

const sosEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["Manual SOS", "Auto SOS"],
      default: "Manual SOS",
    },

    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },

    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },

    googleMapsUrl: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      default: "SOS ALERT! I need help.",
      trim: true,
    },

    contactsNotified: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Pending", "Sent", "Resolved"],
      default: "Sent",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SosEvent", sosEventSchema);