const mongoose = require("mongoose");

const medicalProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    birthDate: {
      type: String,
      default: "",
      trim: true,
    },

    bloodType: {
      type: String,
      default: "",
      trim: true,
    },

    allergies: {
      type: String,
      default: "",
      trim: true,
    },

    medicalConditions: {
      type: String,
      default: "",
      trim: true,
    },

    medications: {
      type: String,
      default: "",
      trim: true,
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

module.exports = mongoose.model("MedicalProfile", medicalProfileSchema);