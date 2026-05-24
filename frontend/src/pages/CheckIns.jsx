import { useEffect, useState } from "react";
import api from "../services/api";

function CheckIns() {
  const [checkIns, setCheckIns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    destinationName: "",
    destinationAddress: "",
    destinationLatitude: "",
    destinationLongitude: "",
    expectedArrivalTime: "",
    safetyMessage: "",
    notes: "",
  });

  const fetchCheckIns = async () => {
    try {
      const response = await api.get("/api/checkins");
      setCheckIns(response.data.checkIns);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load check-ins.");
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get("/api/checkins/summary");
      setSummary(response.data.summary);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCheckIns();
    fetchSummary();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setEditingId(null);

    setForm({
      title: "",
      destinationName: "",
      destinationAddress: "",
      destinationLatitude: "",
      destinationLongitude: "",
      expectedArrivalTime: "",
      safetyMessage: "",
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      destinationLatitude: Number(form.destinationLatitude),
      destinationLongitude: Number(form.destinationLongitude),
    };

    try {
      if (editingId) {
        await api.put(`/api/checkins/${editingId}`, payload);
        setMessage("Check-in updated successfully.");
      } else {
        await api.post("/api/checkins", payload);
        setMessage("Check-in created successfully.");
      }

      resetForm();
      fetchCheckIns();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Check-in action failed.");
    }
  };

  const handleEdit = (checkIn) => {
    setEditingId(checkIn._id);

    setForm({
      title: checkIn.title || "",
      destinationName: checkIn.destinationName || "",
      destinationAddress: checkIn.destinationAddress || "",
      destinationLatitude: checkIn.destinationLatitude || "",
      destinationLongitude: checkIn.destinationLongitude || "",
      expectedArrivalTime: checkIn.expectedArrivalTime
        ? checkIn.expectedArrivalTime.slice(0, 16)
        : "",
      safetyMessage: checkIn.safetyMessage || "",
      notes: checkIn.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeCheckIn = async (id) => {
    try {
      await api.patch(`/api/checkins/${id}/complete`);
      setMessage("Check-in completed successfully.");
      fetchCheckIns();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not complete check-in.");
    }
  };

  const markMissed = async (id) => {
    const confirmMissed = window.confirm(
      "Mark this check-in as missed? This will also create an Auto SOS event."
    );

    if (!confirmMissed) return;

    try {
      await api.patch(`/api/checkins/${id}/missed`);
      setMessage("Check-in marked as missed and Auto SOS was created.");
      fetchCheckIns();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not mark check-in as missed.");
    }
  };

  const cancelCheckIn = async (id) => {
    try {
      await api.patch(`/api/checkins/${id}/cancel`);
      setMessage("Check-in cancelled successfully.");
      fetchCheckIns();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not cancel check-in.");
    }
  };

  const deleteCheckIn = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this check-in?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/checkins/${id}`);
      setMessage("Check-in deleted successfully.");
      fetchCheckIns();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "status-resolved";
    if (status === "Missed") return "status-high";
    if (status === "Cancelled") return "status-cancelled";
    return "status-pending";
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Preventive Safety Module</p>
        <h1>Safety Check-Ins</h1>
        <p>
          Create a check-in before traveling alone. If the check-in is missed,
          the system can create an Auto SOS event automatically.
        </p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="checkin-summary-grid">
        <div className="stat-card">
          <span>🧭</span>
          <p>Total Check-Ins</p>
          <h2>{summary?.total || 0}</h2>
        </div>

        <div className="stat-card">
          <span>⏳</span>
          <p>Active</p>
          <h2>{summary?.active || 0}</h2>
        </div>

        <div className="stat-card">
          <span>✅</span>
          <p>Completed</p>
          <h2>{summary?.completed || 0}</h2>
        </div>

        <div className="stat-card">
          <span>⚠️</span>
          <p>Missed</p>
          <h2>{summary?.missed || 0}</h2>
        </div>
      </div>

      <div className="form-card">
        <h2>{editingId ? "Update Check-In" : "Create Safety Check-In"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            name="title"
            placeholder="e.g. Walking home from university"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Destination Name</label>
          <input
            name="destinationName"
            placeholder="e.g. Home"
            value={form.destinationName}
            onChange={handleChange}
            required
          />

          <label>Destination Address</label>
          <input
            name="destinationAddress"
            placeholder="e.g. Mitrovica, Kosovo"
            value={form.destinationAddress}
            onChange={handleChange}
          />

          <div className="two-column-form">
            <div>
              <label>Destination Latitude</label>
              <input
                name="destinationLatitude"
                placeholder="42.870307"
                value={form.destinationLatitude}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Destination Longitude</label>
              <input
                name="destinationLongitude"
                placeholder="20.876545"
                value={form.destinationLongitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label>Expected Arrival Time</label>
          <input
            type="datetime-local"
            name="expectedArrivalTime"
            value={form.expectedArrivalTime}
            onChange={handleChange}
            required
          />

          <label>Safety Message</label>
          <textarea
            name="safetyMessage"
            placeholder="I am going home and I should arrive soon."
            value={form.safetyMessage}
            onChange={handleChange}
          />

          <label>Notes</label>
          <textarea
            name="notes"
            placeholder="Extra details about this check-in..."
            value={form.notes}
            onChange={handleChange}
          />

          <div className="button-row">
            <button className="primary-btn">
              {editingId ? "Update Check-In" : "Create Check-In"}
            </button>

            {editingId && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="section-row">
        <div className="section-title">
          <h2>Check-In History</h2>
          <p>Track safety trips, missed check-ins and completed arrivals.</p>
        </div>
      </div>

      <div className="list">
        {checkIns.length === 0 ? (
          <p className="empty-text">No check-ins yet.</p>
        ) : (
          checkIns.map((checkIn) => (
            <div className="list-card" key={checkIn._id}>
              <div>
                <div className="title-with-badge">
                  <h3>{checkIn.title}</h3>
                  <span className={`status-pill ${getStatusClass(checkIn.status)}`}>
                    {checkIn.status}
                  </span>
                </div>

                <p>
                  Destination: <strong>{checkIn.destinationName}</strong>
                </p>

                <p>{checkIn.destinationAddress}</p>

                <p>
                  Expected arrival:{" "}
                  {new Date(checkIn.expectedArrivalTime).toLocaleString()}
                </p>

                <a
                  href={`https://maps.google.com/?q=${checkIn.destinationLatitude},${checkIn.destinationLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Destination in Google Maps
                </a>

                <small>{checkIn.safetyMessage}</small>
                <br />
                <small>{checkIn.notes}</small>
              </div>

              <div className="button-column">
                {checkIn.status === "Active" && (
                  <>
                    <button
                      className="primary-btn"
                      onClick={() => completeCheckIn(checkIn._id)}
                    >
                      Complete
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => markMissed(checkIn._id)}
                    >
                      Mark Missed
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => cancelCheckIn(checkIn._id)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button className="secondary-btn" onClick={() => handleEdit(checkIn)}>
                  Edit
                </button>

                <button className="danger-btn" onClick={() => deleteCheckIn(checkIn._id)}>
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

export default CheckIns;