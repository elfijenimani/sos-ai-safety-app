const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

const normalizePhoneNumber = (phone) => {
  if (!phone) return null;

  let cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("00")) {
    return `+${cleaned.slice(2)}`;
  }

  // Kosovo local format: 049xxxxxx, 046xxxxxx, 044xxxxxx
  if (cleaned.startsWith("0")) {
    return `+383${cleaned.slice(1)}`;
  }

  // If user wrote 38349xxxxxx
  if (cleaned.startsWith("383")) {
    return `+${cleaned}`;
  }

  return cleaned;
};

const sendSms = async ({ to, body }) => {
  if (process.env.SMS_ENABLED !== "true") {
    return {
      success: false,
      skipped: true,
      reason: "SMS is disabled in environment variables.",
    };
  }

  if (!client || !fromNumber) {
    return {
      success: false,
      reason: "Twilio credentials or phone number are missing.",
    };
  }

  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo) {
    return {
      success: false,
      reason: "Invalid phone number.",
    };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    });

    return {
      success: true,
      sid: message.sid,
      to: normalizedTo,
    };
  } catch (error) {
    return {
      success: false,
      to: normalizedTo,
      reason: error.message,
    };
  }
};

module.exports = {
  sendSms,
  normalizePhoneNumber,
};