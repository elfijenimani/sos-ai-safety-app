const express = require("express");
const IncidentReport = require("../models/IncidentReport");
const SosEvent = require("../models/SosEvent");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE INCIDENT REPORT
router.post("/", protect, async (req, res) => {
  try {
    const {
      sosEvent,
      title,
      category,
      severity,
      status,
      description,
      locationSummary,
      peopleContacted,
      followUpActions,
      resolved,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required.",
      });
    }

    if (sosEvent) {
      const existingSosEvent = await SosEvent.findOne({
        _id: sosEvent,
        user: req.user._id,
      });

      if (!existingSosEvent) {
        return res.status(404).json({
          message: "Linked SOS event not found.",
        });
      }
    }

    const incidentReport = await IncidentReport.create({
      user: req.user._id,
      sosEvent: sosEvent || null,
      title,
      category,
      severity,
      status,
      description,
      locationSummary,
      peopleContacted,
      followUpActions,
      resolved: resolved || false,
      resolvedAt: resolved ? new Date() : null,
    });

    return res.status(201).json({
      message: "Incident report created successfully.",
      incidentReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating incident report.",
      error: error.message,
    });
  }
});

// GET INCIDENT SUMMARY
router.get("/summary", protect, async (req, res) => {
  try {
    const total = await IncidentReport.countDocuments({ user: req.user._id });

    const open = await IncidentReport.countDocuments({
      user: req.user._id,
      status: "Open",
    });

    const reviewed = await IncidentReport.countDocuments({
      user: req.user._id,
      status: "Reviewed",
    });

    const closed = await IncidentReport.countDocuments({
      user: req.user._id,
      status: "Closed",
    });

    const highSeverity = await IncidentReport.countDocuments({
      user: req.user._id,
      severity: "High",
    });

    const resolved = await IncidentReport.countDocuments({
      user: req.user._id,
      resolved: true,
    });

    return res.status(200).json({
      summary: {
        total,
        open,
        reviewed,
        closed,
        highSeverity,
        resolved,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching incident summary.",
      error: error.message,
    });
  }
});

// READ ALL INCIDENT REPORTS
router.get("/", protect, async (req, res) => {
  try {
    const incidentReports = await IncidentReport.find({
      user: req.user._id,
    })
      .populate("sosEvent", "type status googleMapsUrl createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: incidentReports.length,
      incidentReports,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching incident reports.",
      error: error.message,
    });
  }
});

// READ ONE INCIDENT REPORT
router.get("/:id", protect, async (req, res) => {
  try {
    const incidentReport = await IncidentReport.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("sosEvent", "type status googleMapsUrl createdAt");

    if (!incidentReport) {
      return res.status(404).json({
        message: "Incident report not found.",
      });
    }

    return res.status(200).json({
      incidentReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching incident report.",
      error: error.message,
    });
  }
});

// UPDATE INCIDENT REPORT
router.put("/:id", protect, async (req, res) => {
  try {
    const incidentReport = await IncidentReport.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!incidentReport) {
      return res.status(404).json({
        message: "Incident report not found.",
      });
    }

    if (req.body.title) incidentReport.title = req.body.title;
    if (req.body.category) incidentReport.category = req.body.category;
    if (req.body.severity) incidentReport.severity = req.body.severity;
    if (req.body.status) incidentReport.status = req.body.status;
    if (req.body.description) incidentReport.description = req.body.description;

    if (req.body.locationSummary !== undefined) {
      incidentReport.locationSummary = req.body.locationSummary;
    }

    if (req.body.peopleContacted !== undefined) {
      incidentReport.peopleContacted = req.body.peopleContacted;
    }

    if (req.body.followUpActions !== undefined) {
      incidentReport.followUpActions = req.body.followUpActions;
    }

    if (req.body.resolved !== undefined) {
      incidentReport.resolved = req.body.resolved;
      incidentReport.resolvedAt = req.body.resolved ? new Date() : null;
    }

    const updatedIncidentReport = await incidentReport.save();

    return res.status(200).json({
      message: "Incident report updated successfully.",
      incidentReport: updatedIncidentReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating incident report.",
      error: error.message,
    });
  }
});

// MARK INCIDENT AS REVIEWED
router.patch("/:id/reviewed", protect, async (req, res) => {
  try {
    const incidentReport = await IncidentReport.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!incidentReport) {
      return res.status(404).json({
        message: "Incident report not found.",
      });
    }

    incidentReport.status = "Reviewed";

    const updatedIncidentReport = await incidentReport.save();

    return res.status(200).json({
      message: "Incident report marked as reviewed.",
      incidentReport: updatedIncidentReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while reviewing incident report.",
      error: error.message,
    });
  }
});

// MARK INCIDENT AS CLOSED
router.patch("/:id/closed", protect, async (req, res) => {
  try {
    const incidentReport = await IncidentReport.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!incidentReport) {
      return res.status(404).json({
        message: "Incident report not found.",
      });
    }

    incidentReport.status = "Closed";
    incidentReport.resolved = true;
    incidentReport.resolvedAt = new Date();

    const updatedIncidentReport = await incidentReport.save();

    return res.status(200).json({
      message: "Incident report closed successfully.",
      incidentReport: updatedIncidentReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while closing incident report.",
      error: error.message,
    });
  }
});

// DELETE INCIDENT REPORT
router.delete("/:id", protect, async (req, res) => {
  try {
    const incidentReport = await IncidentReport.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!incidentReport) {
      return res.status(404).json({
        message: "Incident report not found.",
      });
    }

    await incidentReport.deleteOne();

    return res.status(200).json({
      message: "Incident report deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting incident report.",
      error: error.message,
    });
  }
});

module.exports = router;