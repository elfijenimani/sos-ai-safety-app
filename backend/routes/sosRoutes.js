const express = require("express");
const SosEvent = require("../models/SosEvent");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE SOS EVENT
router.post("/", protect, async (req, res) => {
  try {
    const {
      type,
      latitude,
      longitude,
      message,
      contactsNotified,
      status,
      notes,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required.",
      });
    }

    const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    const sosEvent = await SosEvent.create({
      user: req.user._id,
      type,
      latitude,
      longitude,
      googleMapsUrl,
      message,
      contactsNotified,
      status,
      notes,
    });

    return res.status(201).json({
      message: "SOS event created successfully.",
      sosEvent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating SOS event.",
      error: error.message,
    });
  }
});

// READ ALL SOS EVENTS
router.get("/", protect, async (req, res) => {
  try {
    const sosEvents = await SosEvent.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: sosEvents.length,
      sosEvents,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching SOS history.",
      error: error.message,
    });
  }
});

// READ ONE SOS EVENT
router.get("/:id", protect, async (req, res) => {
  try {
    const sosEvent = await SosEvent.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sosEvent) {
      return res.status(404).json({
        message: "SOS event not found.",
      });
    }

    return res.status(200).json({
      sosEvent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching SOS event.",
      error: error.message,
    });
  }
});

// UPDATE SOS EVENT
router.put("/:id", protect, async (req, res) => {
  try {
    const sosEvent = await SosEvent.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sosEvent) {
      return res.status(404).json({
        message: "SOS event not found.",
      });
    }

    if (req.body.type) sosEvent.type = req.body.type;
    if (req.body.latitude !== undefined) sosEvent.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) sosEvent.longitude = req.body.longitude;
    if (req.body.message) sosEvent.message = req.body.message;
    if (req.body.contactsNotified) {
      sosEvent.contactsNotified = req.body.contactsNotified;
    }
    if (req.body.status) sosEvent.status = req.body.status;
    if (req.body.notes !== undefined) sosEvent.notes = req.body.notes;

    if (
      req.body.latitude !== undefined ||
      req.body.longitude !== undefined
    ) {
      sosEvent.googleMapsUrl = `https://maps.google.com/?q=${sosEvent.latitude},${sosEvent.longitude}`;
    }

    const updatedSosEvent = await sosEvent.save();

    return res.status(200).json({
      message: "SOS event updated successfully.",
      sosEvent: updatedSosEvent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating SOS event.",
      error: error.message,
    });
  }
});

// DELETE ONE SOS EVENT
router.delete("/:id", protect, async (req, res) => {
  try {
    const sosEvent = await SosEvent.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sosEvent) {
      return res.status(404).json({
        message: "SOS event not found.",
      });
    }

    await sosEvent.deleteOne();

    return res.status(200).json({
      message: "SOS event deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting SOS event.",
      error: error.message,
    });
  }
});

// CLEAR ALL SOS HISTORY
router.delete("/", protect, async (req, res) => {
  try {
    const result = await SosEvent.deleteMany({ user: req.user._id });

    return res.status(200).json({
      message: "SOS history cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while clearing SOS history.",
      error: error.message,
    });
  }
});

module.exports = router;