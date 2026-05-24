const express = require("express");
const Contact = require("../models/Contact");
const MedicalProfile = require("../models/MedicalProfile");
const SosEvent = require("../models/SosEvent");
const SafePlace = require("../models/SafePlace");
const CheckIn = require("../models/CheckIn");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const buildSafetyProfile = async (userId) => {
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
  const missedCheckIns = await CheckIn.countDocuments({
    user: userId,
    status: "Missed",
  });

  let riskScore = 5;
  const issues = [];

  if (totalContacts < 2) {
    riskScore += 25;
    issues.push("You should add at least two emergency contacts.");
  }

  if (primaryContacts === 0) {
    riskScore += 12;
    issues.push("You should set one contact as primary.");
  }

  if (!medicalProfile) {
    riskScore += 22;
    issues.push("Your Medical ID is missing.");
  }

  if (totalSafePlaces === 0) {
    riskScore += 15;
    issues.push("You should add at least one safe place.");
  }

  if (primarySafePlaces === 0 && totalSafePlaces > 0) {
    riskScore += 6;
    issues.push("You should mark one safe place as primary.");
  }

  if (pendingSosEvents > 0) {
    riskScore += 18;
    issues.push("You have pending SOS events that should be reviewed.");
  }

  if (missedCheckIns > 0) {
    riskScore += 25;
    issues.push("You have missed check-ins that increase your safety risk.");
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel = "LOW";

  if (riskScore >= 70) {
    riskLevel = "HIGH";
  } else if (riskScore >= 40) {
    riskLevel = "MEDIUM";
  }

  return {
    totalContacts,
    primaryContacts,
    hasMedicalProfile: !!medicalProfile,
    totalSosEvents,
    pendingSosEvents,
    totalSafePlaces,
    primarySafePlaces,
    totalCheckIns,
    activeCheckIns,
    missedCheckIns,
    riskScore,
    riskLevel,
    issues,
  };
};

const createAssistantAnswer = (question, profile) => {
  const normalizedQuestion = question.toLowerCase();

  if (
    normalizedQuestion.includes("complete") ||
    normalizedQuestion.includes("profile")
  ) {
    if (profile.issues.length === 0) {
      return {
        title: "Your safety profile looks strong",
        answer:
          "Your profile is well prepared. You have the main safety components configured, including contacts, medical data, safe places and SOS history.",
        actionItems: ["Keep your data updated regularly."],
      };
    }

    return {
      title: "Your safety profile needs improvement",
      answer:
        "Your safety profile is not fully complete yet. The system detected some missing or weak safety areas.",
      actionItems: profile.issues,
    };
  }

  if (
    normalizedQuestion.includes("risk") ||
    normalizedQuestion.includes("danger")
  ) {
    return {
      title: `Your current risk level is ${profile.riskLevel}`,
      answer: `Your AI Safety Risk Score is ${profile.riskScore}/100. This score is calculated using your emergency contacts, Medical ID, safe places, SOS events and check-in history.`,
      actionItems:
        profile.issues.length > 0
          ? profile.issues
          : ["No major risk issues detected right now."],
    };
  }

  if (
    normalizedQuestion.includes("contact") ||
    normalizedQuestion.includes("contacts")
  ) {
    return {
      title: "Emergency contacts analysis",
      answer: `You currently have ${profile.totalContacts} emergency contact(s), and ${profile.primaryContacts} primary contact(s).`,
      actionItems:
        profile.totalContacts >= 2 && profile.primaryContacts > 0
          ? ["Your emergency contact setup looks good."]
          : [
              "Add at least two emergency contacts.",
              "Mark one contact as primary.",
            ],
    };
  }

  if (
    normalizedQuestion.includes("medical") ||
    normalizedQuestion.includes("health")
  ) {
    return {
      title: "Medical ID analysis",
      answer: profile.hasMedicalProfile
        ? "Your Medical ID exists and can help provide important information during an emergency."
        : "Your Medical ID is missing. This is important because emergency responders may need your blood type, allergies, medications and medical notes.",
      actionItems: profile.hasMedicalProfile
        ? ["Keep your Medical ID updated."]
        : ["Create your Medical ID as soon as possible."],
    };
  }

  if (
    normalizedQuestion.includes("travel") ||
    normalizedQuestion.includes("alone") ||
    normalizedQuestion.includes("check")
  ) {
    return {
      title: "Travel safety recommendation",
      answer:
        "Before traveling alone, you should create a Safety Check-In, make sure your emergency contacts are ready, and confirm that you have at least one safe place saved.",
      actionItems: [
        "Create a Safety Check-In before leaving.",
        "Make sure you have at least two emergency contacts.",
        "Save your destination or home as a Safe Place.",
        "Keep your Medical ID completed.",
      ],
    };
  }

  if (
    normalizedQuestion.includes("safe place") ||
    normalizedQuestion.includes("location")
  ) {
    return {
      title: "Safe places analysis",
      answer: `You currently have ${profile.totalSafePlaces} safe place(s), and ${profile.primarySafePlaces} primary safe place(s).`,
      actionItems:
        profile.totalSafePlaces > 0
          ? ["Use the nearest safe place feature when you feel unsure."]
          : ["Add safe places such as home, university, hospital or police station."],
    };
  }

  return {
    title: "General safety assistant response",
    answer:
      "Based on your current profile, the assistant recommends keeping emergency contacts, Medical ID, safe places and check-ins updated.",
    actionItems:
      profile.issues.length > 0
        ? profile.issues
        : ["Your safety setup looks good right now."],
  };
};

// ASK SAFETY ASSISTANT
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required.",
      });
    }

    const profile = await buildSafetyProfile(req.user._id);
    const assistantResponse = createAssistantAnswer(question, profile);

    return res.status(200).json({
      question,
      profile,
      response: assistantResponse,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while generating assistant response.",
      error: error.message,
    });
  }
});

module.exports = router;