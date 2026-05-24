const express = require("express");
const Contact = require("../models/Contact");
const SosEvent = require("../models/SosEvent");
const protect = require("../middleware/authMiddleware");
const { sendSms } = require("../services/smsService");

const router = express.Router();

router.post("/send-sos-sms", protect, async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      message,
      riskLevel,
      sendOnlyPrimaryContacts,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required.",
      });
    }

    const query = {
      user: req.user._id,
    };

    if (sendOnlyPrimaryContacts) {
      query.isPrimary = true;
    }

    const contacts = await Contact.find(query);

    if (contacts.length === 0) {
      return res.status(404).json({
        message: "No emergency contacts found.",
      });
    }

    const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    const smsBody =
      message ||
      `SOS ALERT from GuardianAI.\nRisk level: ${
        riskLevel || "UNKNOWN"
      }\nI may need help.\nMy location: ${googleMapsUrl}`;

    const results = [];

    for (const contact of contacts) {
      const result = await sendSms({
        to: contact.phone,
        body: smsBody,
      });

      results.push({
        contactId: contact._id,
        name: contact.name,
        phone: contact.phone,
        ...result,
      });
    }

    const successfulMessages = results.filter((item) => item.success);
    const failedMessages = results.filter((item) => !item.success);

    const sosEvent = await SosEvent.create({
      user: req.user._id,
      type: riskLevel === "HIGH" ? "Auto SOS" : "Manual SOS",
      latitude,
      longitude,
      googleMapsUrl,
      message: smsBody,
      contactsNotified: successfulMessages.map(
        (item) => `${item.name} (${item.to || item.phone})`
      ),
      status: successfulMessages.length > 0 ? "Sent" : "Pending",
      notes: `SMS notification attempt. Success: ${successfulMessages.length}, Failed: ${failedMessages.length}`,
    });

    return res.status(200).json({
      message: "Emergency SMS process completed.",
      totalContacts: contacts.length,
      sent: successfulMessages.length,
      failed: failedMessages.length,
      results,
      sosEvent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while sending SOS SMS notifications.",
      error: error.message,
    });
  }
});

module.exports = router;