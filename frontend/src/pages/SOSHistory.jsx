import { useEffect, useState } from "react";
import api from "../services/api";

function SOSHistory() {
  const [sosEvents, setSosEvents] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    type: "Manual SOS",
    latitude: "42.870307",
    longitude: "20.876545",
    message: "SOS ALERT! I need help.",
    contactsNotified: "Mom +38348595969, Edi +38346222294",
    status: "Sent",
    notes: "Manual SOS test from React frontend.",
  });

  const fetchSosEvents = async () => {
    try {
      const response = await api.get("/api/sos");
      setSosEvents(response.data.sosEvents);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load SOS history.");
    }
  };

  useEffect(() => {
    fetchSosEvents();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createSosEvent = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/api/sos", {
        type: form.type,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        message: form.message,
        contactsNotified: form.contactsNotified
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: form.status,
        notes: form.notes,
      });

      setMessage("SOS event created successfully.");
      fetchSosEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || "SOS event creation failed.");
    }
  };

  const markResolved = async (id) => {
    try {
      await api.put(`/api/sos/${id}`, {
        status: "Resolved",
        notes: "SOS event reviewed and marked as resolved from frontend.",
      });

      setMessage("SOS event marked as resolved.");
      fetchSosEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || "Update failed.");
    }
  };

  const deleteSosEvent = async (id) => {
    const confirmDelete = window.confirm("Delete this SOS event?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/sos/${id}`);
      setMessage("SOS event deleted successfully.");
      fetchSosEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  const clearHistory = async () => {
    const confirmClear = window.confirm("Delete all SOS history?");
    if (!confirmClear) return;

    try {
      await api.delete("/api/sos");
      setMessage("SOS history cleared successfully.");
      fetchSosEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || "Clear history failed.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>SOS History</h1>
        <p>Create and manage SOS alerts with location and Google Maps links.</p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="form-card">
        <h2>Create SOS Event</h2>

        <form onSubmit={createSosEvent}>
          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="Manual SOS">Manual SOS</option>
            <option value="Auto SOS">Auto SOS</option>
          </select>

          <label>Latitude</label>
          <input
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            required
          />

          <label>Longitude</label>
          <input
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            required
          />

          <label>Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
          />

          <label>Contacts Notified</label>
          <textarea
            name="contactsNotified"
            value={form.contactsNotified}
            onChange={handleChange}
          />

          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Resolved">Resolved</option>
          </select>

          <label>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} />

          <button className="primary-btn">Create SOS Event</button>
        </form>
      </div>

      <div className="section-row">
        <h2>History</h2>
        {sosEvents.length > 0 && (
          <button className="danger-btn" onClick={clearHistory}>
            Clear All
          </button>
        )}
      </div>

      <div className="list">
        {sosEvents.length === 0 ? (
          <p className="empty-text">No SOS events yet.</p>
        ) : (
          sosEvents.map((event) => (
            <div className="list-card" key={event._id}>
              <div>
                <h3>{event.type}</h3>
                <p>Status: {event.status}</p>
                <p>
                  Location: {event.latitude}, {event.longitude}
                </p>

                <a href={event.googleMapsUrl} target="_blank" rel="noreferrer">
                  Open Google Maps
                </a>

                <p>{event.message}</p>
                <small>{event.notes}</small>

                <div className="tag-row">
                  {event.contactsNotified?.map((contact, index) => (
                    <span className="tag" key={index}>
                      {contact}
                    </span>
                  ))}
                </div>
              </div>

              <div className="button-column">
                {event.status !== "Resolved" && (
                  <button className="secondary-btn" onClick={() => markResolved(event._id)}>
                    Mark Resolved
                  </button>
                )}

                <button className="danger-btn" onClick={() => deleteSosEvent(event._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SOSHistory;