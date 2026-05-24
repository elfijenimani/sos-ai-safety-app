const express = require("express");
const Contact = require("../models/Contact");
const MedicalProfile = require("../models/MedicalProfile");
const SosEvent = require("../models/SosEvent");
const SafePlace = require("../models/SafePlace");
const CheckIn = require("../models/CheckIn");
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

router.get("/stats", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    await refreshMissedCheckIns(userId);

    const totalContacts = await Contact.countDocuments({ user: userId });

    const primaryContacts = await Contact.countDocuments({
      user: userId,
      isPrimary: true,
    });

    const medicalProfile = await MedicalProfile.findOne({ user: userId });

    const totalSosEvents = await SosEvent.countDocuments({ user: userId });

    const pendingSosEvents = await SosEvent.countDocuments({
      user: userId,
      status: "Pending",
    });

    const resolvedSosEvents = await SosEvent.countDocuments({
      user: userId,
      status: "Resolved",
    });

    const sentSosEvents = await SosEvent.countDocuments({
      user: userId,
      status: "Sent",
    });

    const totalSafePlaces = await SafePlace.countDocuments({ user: userId });

    const primarySafePlaces = await SafePlace.countDocuments({
      user: userId,
      isPrimarySafePlace: true,
    });

    const totalCheckIns = await CheckIn.countDocuments({ user: userId });

    const activeCheckIns = await CheckIn.countDocuments({
      user: userId,
      status: "Active",
    });

    const completedCheckIns = await CheckIn.countDocuments({
      user: userId,
      status: "Completed",
    });

    const missedCheckIns = await CheckIn.countDocuments({
      user: userId,
      status: "Missed",
    });

    const cancelledCheckIns = await CheckIn.countDocuments({
      user: userId,
      status: "Cancelled",
    });

    const recentSosEvents = await SosEvent.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCheckIns = await CheckIn.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recommendations = [];

    let riskScore = 5;
    let completionScore = 0;

    if (totalContacts >= 2) {
      completionScore += 20;
    } else {
      riskScore += 25;
      recommendations.push({
        type: "contacts",
        priority: "High",
        title: "Add more emergency contacts",
        message:
          "Add at least two trusted emergency contacts so the SOS system has more than one person to notify.",
      });
    }

    if (primaryContacts > 0) {
      completionScore += 15;
    } else {
      riskScore += 12;
      recommendations.push({
        type: "primary-contact",
        priority: "Medium",
        title: "Set a primary emergency contact",
        message:
          "Choose one contact as primary so the system knows who should be contacted first.",
      });
    }

    if (medicalProfile) {
      completionScore += 20;
    } else {
      riskScore += 22;
      recommendations.push({
        type: "medical",
        priority: "High",
        title: "Complete your Medical ID",
        message:
          "Add blood type, allergies, medications and medical notes for emergency situations.",
      });
    }

    if (totalSafePlaces > 0) {
      completionScore += 15;
    } else {
      riskScore += 15;
      recommendations.push({
        type: "safe-places",
        priority: "Medium",
        title: "Add safe places",
        message:
          "Save locations like home, university, hospital or police station to calculate nearest safe places.",
      });
    }

    if (primarySafePlaces > 0) {
      completionScore += 10;
    } else if (totalSafePlaces > 0) {
      riskScore += 6;
      recommendations.push({
        type: "primary-safe-place",
        priority: "Low",
        title: "Mark one safe place as primary",
        message:
          "Mark your most trusted location as primary safe place for faster emergency planning.",
      });
    }

    if (completedCheckIns > 0 || activeCheckIns > 0) {
      completionScore += 10;
    } else {
      recommendations.push({
        type: "checkins",
        priority: "Low",
        title: "Use Safety Check-Ins",
        message:
          "Create check-ins when traveling alone. If a check-in is missed, the system can create an Auto SOS.",
      });
    }

    if (pendingSosEvents > 0) {
      riskScore += 18;
      recommendations.push({
        type: "pending-sos",
        priority: "High",
        title: "Resolve pending SOS events",
        message:
          "You have pending SOS events. Review and mark them as resolved when the situation is handled.",
      });
    }

    if (missedCheckIns > 0) {
      riskScore += 25;
      recommendations.push({
        type: "missed-checkins",
        priority: "High",
        title: "Review missed check-ins",
        message:
          "Missed check-ins increase risk. Review them and confirm whether help was needed.",
      });
    }

    if (activeCheckIns > 0) {
      recommendations.push({
        type: "active-checkins",
        priority: "Medium",
        title: "You have active check-ins",
        message:
          "Make sure to complete your active check-ins once you arrive safely.",
      });
    }

    if (totalSosEvents >= 5) {
      riskScore += 8;
      recommendations.push({
        type: "sos-frequency",
        priority: "Medium",
        title: "High SOS activity detected",
        message:
          "Several SOS events were created. Review your safety habits and emergency patterns.",
      });
    }

    riskScore = Math.min(riskScore, 100);
    completionScore = Math.min(completionScore, 100);

    let riskLevel = "LOW";

    if (riskScore >= 70) {
      riskLevel = "HIGH";
    } else if (riskScore >= 40) {
      riskLevel = "MEDIUM";
    }

    let safetyStatus = "Strong";

    if (completionScore < 40) {
      safetyStatus = "Needs attention";
    } else if (completionScore < 75) {
      safetyStatus = "Improving";
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "complete",
        priority: "Low",
        title: "Your safety profile looks strong",
        message:
          "Your emergency contacts, Medical ID, Safe Places and SOS setup are in good condition.",
      });
    }

    return res.status(200).json({
      stats: {
        totalContacts,
        primaryContacts,
        hasMedicalProfile: !!medicalProfile,

        totalSosEvents,
        pendingSosEvents,
        resolvedSosEvents,
        sentSosEvents,

        totalSafePlaces,
        primarySafePlaces,

        totalCheckIns,
        activeCheckIns,
        completedCheckIns,
        missedCheckIns,
        cancelledCheckIns,

        riskScore,
        riskLevel,
        completionScore,
        safetyStatus,

        recommendations,
        recentSosEvents,
        recentCheckIns,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching dashboard stats.",
      error: error.message,
    });
  }
});

module.exports = router;