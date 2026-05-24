const mongoose = require("mongoose");

const safePlaceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Safe place name is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["Home", "University", "Work", "Hospital", "Police Station", "Friend", "Other"],
      default: "Other",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },

    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    isPrimarySafePlace: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SafePlace", safePlaceSchema);