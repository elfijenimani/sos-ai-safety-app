const express = require("express");
const CheckIn = require("../models/CheckIn");
const SosEvent = require("../models/SosEvent");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const refreshMissedCheckIns = async (userId) => {
  const now = new Date();

  await CheckIn.updateMany(
    {
      user: userId,
      status: "Active",
      expectedArrivalTime: { $lt: now },
    },
    {
      $set: {
        status: "Missed",
        missedAt: now,
      },
    }
  );
};

// CREATE CHECK-IN
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      destinationName,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      expectedArrivalTime,
      safetyMessage,
      notes,
    } = req.body;

    if (
      !title ||
      !destinationName ||
      destinationLatitude === undefined ||
      destinationLongitude === undefined ||
      !expectedArrivalTime
    ) {
      return res.status(400).json({
        message:
          "Title, destination name, destination coordinates and expected arrival time are required.",
      });
    }

    const checkIn = await CheckIn.create({
      user: req.user._id,
      title,
      destinationName,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      expectedArrivalTime,
      safetyMessage,
      notes,
      status: "Active",
    });

    return res.status(201).json({
      message: "Check-in created successfully.",
      checkIn,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating check-in.",
      error: error.message,
    });
  }
});

// READ ALL CHECK-INS
router.get("/", protect, async (req, res) => {
  try {
    await refreshMissedCheckIns(req.user._id);

    const checkIns = await CheckIn.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: checkIns.length,
      checkIns,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching check-ins.",
      error: error.message,
    });
  }
});

// CHECK-IN SUMMARY
router.get("/summary", protect, async (req, res) => {
  try {
    await refreshMissedCheckIns(req.user._id);

    const total = await CheckIn.countDocuments({ user: req.user._id });
    const active = await CheckIn.countDocuments({
      user: req.user._id,
      status: "Active",
    });
    const completed = await CheckIn.countDocuments({
      user: req.user._id,
      status: "Completed",
    });
    const missed = await CheckIn.countDocuments({
      user: req.user._id,
      status: "Missed",
    });
    const cancelled = await CheckIn.countDocuments({
      user: req.user._id,
      status: "Cancelled",
    });

    return res.status(200).json({
      summary: {
        total,
        active,
        completed,
        missed,
        cancelled,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching check-in summary.",
      error: error.message,
    });
  }
});

// READ ONE CHECK-IN
router.get("/:id", protect, async (req, res) => {
  try {
    await refreshMissedCheckIns(req.user._id);

    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    return res.status(200).json({
      checkIn,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching check-in.",
      error: error.message,
    });
  }
});

// UPDATE CHECK-IN
router.put("/:id", protect, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    if (req.body.title) checkIn.title = req.body.title;
    if (req.body.destinationName) checkIn.destinationName = req.body.destinationName;
    if (req.body.destinationAddress !== undefined) {
      checkIn.destinationAddress = req.body.destinationAddress;
    }
    if (req.body.destinationLatitude !== undefined) {
      checkIn.destinationLatitude = req.body.destinationLatitude;
    }
    if (req.body.destinationLongitude !== undefined) {
      checkIn.destinationLongitude = req.body.destinationLongitude;
    }
    if (req.body.expectedArrivalTime) {
      checkIn.expectedArrivalTime = req.body.expectedArrivalTime;
    }
    if (req.body.safetyMessage !== undefined) {
      checkIn.safetyMessage = req.body.safetyMessage;
    }
    if (req.body.notes !== undefined) checkIn.notes = req.body.notes;

    const updatedCheckIn = await checkIn.save();

    return res.status(200).json({
      message: "Check-in updated successfully.",
      checkIn: updatedCheckIn,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating check-in.",
      error: error.message,
    });
  }
});

// MARK AS COMPLETED
router.patch("/:id/complete", protect, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    checkIn.status = "Completed";
    checkIn.completedAt = new Date();

    const updatedCheckIn = await checkIn.save();

    return res.status(200).json({
      message: "Check-in completed successfully.",
      checkIn: updatedCheckIn,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while completing check-in.",
      error: error.message,
    });
  }
});

// MARK AS MISSED + CREATE SOS EVENT
router.patch("/:id/missed", protect, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    checkIn.status = "Missed";
    checkIn.missedAt = new Date();

    const updatedCheckIn = await checkIn.save();

    const googleMapsUrl = `https://maps.google.com/?q=${checkIn.destinationLatitude},${checkIn.destinationLongitude}`;

    const sosEvent = await SosEvent.create({
      user: req.user._id,
      type: "Auto SOS",
      latitude: checkIn.destinationLatitude,
      longitude: checkIn.destinationLongitude,
      googleMapsUrl,
      message: `Auto SOS created from missed check-in: ${checkIn.title}`,
      contactsNotified: ["Trusted emergency contacts"],
      status: "Pending",
      notes: `Missed check-in for destination: ${checkIn.destinationName}`,
    });

    return res.status(200).json({
      message: "Check-in marked as missed and SOS event created.",
      checkIn: updatedCheckIn,
      sosEvent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while marking check-in as missed.",
      error: error.message,
    });
  }
});

// CANCEL CHECK-IN
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    checkIn.status = "Cancelled";
    checkIn.cancelledAt = new Date();

    const updatedCheckIn = await checkIn.save();

    return res.status(200).json({
      message: "Check-in cancelled successfully.",
      checkIn: updatedCheckIn,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while cancelling check-in.",
      error: error.message,
    });
  }
});

// DELETE CHECK-IN
router.delete("/:id", protect, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!checkIn) {
      return res.status(404).json({
        message: "Check-in not found.",
      });
    }

    await checkIn.deleteOne();

    return res.status(200).json({
      message: "Check-in deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting check-in.",
      error: error.message,
    });
  }
});

module.exports = router;