import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function EmergencyNotifications() {
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [preparedAlert, setPreparedAlert] = useState(null);

  const [form, setForm] = useState({
    latitude: "42.870307",
    longitude: "20.876545",
    useCurrentLocation: true,
    customMessage: "SOS ALERT from GuardianAI. I may need help.",
  });

  const googleMapsUrl = useMemo(() => {
    return `https://maps.google.com/?q=${form.latitude},${form.longitude}`;
  }, [form.latitude, form.longitude]);

  const finalSmsMessage = useMemo(() => {
    return `${form.customMessage}\n\nMy location:\n${googleMapsUrl}`;
  }, [form.customMessage, googleMapsUrl]);

  const fetchContacts = async () => {
    try {
      const response = await api.get("/api/contacts");
      setContacts(response.data.contacts || []);
    } catch (error) {
      setSystemMessage(
        error.response?.data?.message || "Failed to load emergency contacts."
      );
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const normalizePhoneNumber = (phone) => {
    if (!phone) return "";

    let cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

    if (cleaned.startsWith("+")) return cleaned;

    if (cleaned.startsWith("00")) {
      return `+${cleaned.slice(2)}`;
    }

    if (cleaned.startsWith("0")) {
      return `+383${cleaned.slice(1)}`;
    }

    if (cleaned.startsWith("383")) {
      return `+${cleaned}`;
    }

    return cleaned;
  };

  const buildSmsUrl = (phone, body) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const encodedBody = encodeURIComponent(body);

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const separator = isIOS ? "&" : "?";

    return `sms:${normalizedPhone}${separator}body=${encodedBody}`;
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(new Error("Location permission denied."));
        }
      );
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const prepareEmergencySms = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSystemMessage("");
    setMessage("");
    setPreparedAlert(null);

    try {
      let latitude = Number(form.latitude);
      let longitude = Number(form.longitude);

      if (form.useCurrentLocation) {
        try {
          const currentLocation = await getCurrentLocation();
          latitude = currentLocation.latitude;
          longitude = currentLocation.longitude;
        } catch (error) {
          setSystemMessage(
            "Current location was not available. Demo location was used instead."
          );
        }
      }

      const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const smsText = `${form.customMessage}\n\nMy location:\n${mapUrl}`;

      const response = await api.post("/api/sos", {
        type: "Manual SOS",
        latitude,
        longitude,
        message: smsText,
        contactsNotified: contacts.map(
          (contact) => `${contact.name} ${normalizePhoneNumber(contact.phone)}`
        ),
        status: "Pending",
        notes:
          "Manual SMS compose prepared. User must open SMS app and press Send.",
      });

      setPreparedAlert({
        sosEvent: response.data.sosEvent,
        latitude,
        longitude,
        googleMapsUrl: mapUrl,
        smsText,
      });

      setForm((prev) => ({
        ...prev,
        latitude: String(latitude),
        longitude: String(longitude),
      }));

      setMessage(
        "SOS event saved. Now open SMS for each contact and press Send on your phone."
      );
    } catch (error) {
      setSystemMessage(
        error.response?.data?.message || "Could not prepare emergency SMS."
      );
    } finally {
      setLoading(false);
    }
  };

  const openSmsApp = (contact) => {
    const smsText = preparedAlert?.smsText || finalSmsMessage;
    const smsUrl = buildSmsUrl(contact.phone, smsText);

    window.location.href = smsUrl;
  };

  const copyMessage = async () => {
    const smsText = preparedAlert?.smsText || finalSmsMessage;

    try {
      await navigator.clipboard.writeText(smsText);
      setMessage("Emergency message copied successfully.");
    } catch (error) {
      setSystemMessage("Could not copy message.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Emergency Communication</p>
        <h1>Manual SMS Notifications</h1>
        <p>
          Prepare an SOS message with location and open the phone SMS app for
          your emergency contacts. This works without Twilio or paid SMS API.
        </p>
      </div>

      {message && <div className="message-box">{message}</div>}
      {systemMessage && <div className="error-box">{systemMessage}</div>}

      <div className="notification-grid">
        <div className="professional-card">
          <h2>Prepare SOS Message</h2>
          <p className="muted-text">
            The app will save an SOS event in MongoDB and generate a ready SMS
            message with your location.
          </p>

          <form onSubmit={prepareEmergencySms}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="useCurrentLocation"
                checked={form.useCurrentLocation}
                onChange={handleChange}
              />
              Use current location if available
            </label>

            <div className="two-column-form">
              <div>
                <label>Latitude</label>
                <input
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Longitude</label>
                <input
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label>Emergency Message</label>
            <textarea
              name="customMessage"
              value={form.customMessage}
              onChange={handleChange}
              required
            />

            <div className="prepared-message-box">
              <span>Message Preview</span>
              <p>{finalSmsMessage}</p>
            </div>

            <div className="button-row">
              <button className="primary-btn" disabled={loading}>
                {loading ? "Preparing..." : "Prepare SOS SMS"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={copyMessage}
              >
                Copy Message
              </button>
            </div>
          </form>
        </div>

        <div className="professional-card">
          <h2>How this works</h2>
          <p className="muted-text">
            Without Twilio, the web app cannot send SMS automatically. Instead,
            it opens the phone SMS app with the contact and message already
            filled in.
          </p>

          <div className="notification-steps">
            <div>
              <strong>1</strong>
              <span>Create SOS message</span>
            </div>

            <div>
              <strong>2</strong>
              <span>Save SOS event in MongoDB</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Open SMS app for each contact</span>
            </div>

            <div>
              <strong>4</strong>
              <span>User presses Send manually</span>
            </div>
          </div>
        </div>
      </div>

      {preparedAlert && (
        <div className="professional-card">
          <div className="section-title">
            <h2>Prepared SOS Alert</h2>
            <p>
              SOS event was saved. Use the buttons below to open SMS for each
              emergency contact.
            </p>
          </div>

          <div className="location-pill">
            <span>📍</span>
            <a href={preparedAlert.googleMapsUrl} target="_blank" rel="noreferrer">
              Open location in Google Maps
            </a>
          </div>
        </div>
      )}

      <div className="section-row">
        <div className="section-title">
          <h2>Emergency Contacts</h2>
          <p>
            Click “Open SMS” for a contact. Your device will open the SMS app
            with the message ready.
          </p>
        </div>
      </div>

      <div className="notification-contact-list">
        {contacts.length === 0 ? (
          <p className="empty-text">
            No contacts found. Add emergency contacts first.
          </p>
        ) : (
          contacts.map((contact) => (
            <div className="notification-contact-card" key={contact._id}>
              <div>
                <h3>
                  {contact.name} {contact.isPrimary && <span>⭐</span>}
                </h3>
                <p>{normalizePhoneNumber(contact.phone)}</p>
                <small>{contact.relationship}</small>
              </div>

              <button className="primary-btn" onClick={() => openSmsApp(contact)}>
                Open SMS
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmergencyNotifications;