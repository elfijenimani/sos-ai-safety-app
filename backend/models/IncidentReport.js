const mongoose = require("mongoose");

const incidentReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sosEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SosEvent",
      default: null,
    },

    title: {
      type: String,
      required: [true, "Incident title is required"],
      trim: true,
    },

    category: {
      type: String,
      enum: ["Personal Safety", "Medical", "Travel", "Location", "Other"],
      default: "Personal Safety",
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Open", "Reviewed", "Closed"],
      default: "Open",
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    locationSummary: {
      type: String,
      default: "",
      trim: true,
    },

    peopleContacted: {
      type: [String],
      default: [],
    },

    followUpActions: {
      type: String,
      default: "",
      trim: true,
    },

    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("IncidentReport", incidentReportSchema);