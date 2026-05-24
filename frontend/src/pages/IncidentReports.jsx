import { useEffect, useState } from "react";
import api from "../services/api";

function IncidentReports() {
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Personal Safety",
    severity: "Medium",
    status: "Open",
    description: "",
    locationSummary: "",
    peopleContacted: "",
    followUpActions: "",
    resolved: false,
  });

  const fetchIncidents = async () => {
    try {
      const response = await api.get("/api/incidents");
      setIncidents(response.data.incidentReports);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load incident reports.");
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get("/api/incidents/summary");
      setSummary(response.data.summary);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchSummary();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setEditingId(null);

    setForm({
      title: "",
      category: "Personal Safety",
      severity: "Medium",
      status: "Open",
      description: "",
      locationSummary: "",
      peopleContacted: "",
      followUpActions: "",
      resolved: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      peopleContacted: form.peopleContacted
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await api.put(`/api/incidents/${editingId}`, payload);
        setMessage("Incident report updated successfully.");
      } else {
        await api.post("/api/incidents", payload);
        setMessage("Incident report created successfully.");
      }

      resetForm();
      fetchIncidents();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Incident action failed.");
    }
  };

  const handleEdit = (incident) => {
    setEditingId(incident._id);

    setForm({
      title: incident.title || "",
      category: incident.category || "Personal Safety",
      severity: incident.severity || "Medium",
      status: incident.status || "Open",
      description: incident.description || "",
      locationSummary: incident.locationSummary || "",
      peopleContacted: incident.peopleContacted?.join(", ") || "",
      followUpActions: incident.followUpActions || "",
      resolved: incident.resolved || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markReviewed = async (id) => {
    try {
      await api.patch(`/api/incidents/${id}/reviewed`);
      setMessage("Incident report marked as reviewed.");
      fetchIncidents();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not mark as reviewed.");
    }
  };

  const markClosed = async (id) => {
    try {
      await api.patch(`/api/incidents/${id}/closed`);
      setMessage("Incident report closed successfully.");
      fetchIncidents();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not close incident.");
    }
  };

  const deleteIncident = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this incident report?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/incidents/${id}`);
      setMessage("Incident report deleted successfully.");
      fetchIncidents();
      fetchSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  const getSeverityClass = (severity) => {
    if (severity === "High") return "severity-high";
    if (severity === "Medium") return "severity-medium";
    return "severity-low";
  };

  const getStatusClass = (status) => {
    if (status === "Closed") return "status-resolved";
    if (status === "Reviewed") return "status-sent";
    return "status-pending";
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Post-Emergency Documentation</p>
        <h1>Incident Reports</h1>
        <p>
          Document what happened after an SOS event, track severity, review status,
          contacted people and follow-up actions.
        </p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="incident-summary-grid">
        <div className="stat-card">
          <span>📄</span>
          <p>Total Reports</p>
          <h2>{summary?.total || 0}</h2>
        </div>

        <div className="stat-card">
          <span>🟡</span>
          <p>Open</p>
          <h2>{summary?.open || 0}</h2>
        </div>

        <div className="stat-card">
          <span>🔵</span>
          <p>Reviewed</p>
          <h2>{summary?.reviewed || 0}</h2>
        </div>

        <div className="stat-card">
          <span>✅</span>
          <p>Closed</p>
          <h2>{summary?.closed || 0}</h2>
        </div>

        <div className="stat-card">
          <span>⚠️</span>
          <p>High Severity</p>
          <h2>{summary?.highSeverity || 0}</h2>
        </div>

        <div className="stat-card">
          <span>🛡️</span>
          <p>Resolved</p>
          <h2>{summary?.resolved || 0}</h2>
        </div>
      </div>

      <div className="form-card">
        <h2>{editingId ? "Update Incident Report" : "Create Incident Report"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            name="title"
            placeholder="e.g. Travel safety concern"
            value={form.title}
            onChange={handleChange}
            required
          />

          <div className="three-column-form">
            <div>
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Personal Safety">Personal Safety</option>
                <option value="Medical">Medical</option>
                <option value="Travel">Travel</option>
                <option value="Location">Location</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label>Severity</label>
              <select name="severity" value={form.severity} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe what happened..."
            value={form.description}
            onChange={handleChange}
            required
          />

          <label>Location Summary</label>
          <input
            name="locationSummary"
            placeholder="e.g. Near university area"
            value={form.locationSummary}
            onChange={handleChange}
          />

          <label>People Contacted</label>
          <input
            name="peopleContacted"
            placeholder="e.g. Mom, Trusted friend"
            value={form.peopleContacted}
            onChange={handleChange}
          />

          <label>Follow-up Actions</label>
          <textarea
            name="followUpActions"
            placeholder="What should be done next?"
            value={form.followUpActions}
            onChange={handleChange}
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="resolved"
              checked={form.resolved}
              onChange={handleChange}
            />
            Mark as resolved
          </label>

          <div className="button-row">
            <button className="primary-btn">
              {editingId ? "Update Report" : "Create Report"}
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
          <h2>Saved Incident Reports</h2>
          <p>Reports are stored in MongoDB and connected to your account.</p>
        </div>
      </div>

      <div className="list">
        {incidents.length === 0 ? (
          <p className="empty-text">No incident reports yet.</p>
        ) : (
          incidents.map((incident) => (
            <div className="list-card" key={incident._id}>
              <div>
                <div className="title-with-badge">
                  <h3>{incident.title}</h3>
                  <span className={`status-pill ${getStatusClass(incident.status)}`}>
                    {incident.status}
                  </span>
                  <span className={`severity-pill ${getSeverityClass(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>

                <p>
                  Category: <strong>{incident.category}</strong>
                </p>

                <p>{incident.description}</p>

                {incident.locationSummary && (
                  <p>Location: {incident.locationSummary}</p>
                )}

                {incident.peopleContacted?.length > 0 && (
                  <div className="tag-row">
                    {incident.peopleContacted.map((person, index) => (
                      <span className="tag" key={index}>
                        {person}
                      </span>
                    ))}
                  </div>
                )}

                {incident.followUpActions && (
                  <small>Follow-up: {incident.followUpActions}</small>
                )}

                <br />

                <small>
                  Created: {new Date(incident.createdAt).toLocaleString()}
                </small>

                {incident.sosEvent && (
                  <div>
                    <a
                      href={incident.sosEvent.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open linked SOS location
                    </a>
                  </div>
                )}
              </div>

              <div className="button-column">
                {incident.status === "Open" && (
                  <button
                    className="secondary-btn"
                    onClick={() => markReviewed(incident._id)}
                  >
                    Mark Reviewed
                  </button>
                )}

                {incident.status !== "Closed" && (
                  <button
                    className="primary-btn"
                    onClick={() => markClosed(incident._id)}
                  >
                    Close
                  </button>
                )}

                <button className="secondary-btn" onClick={() => handleEdit(incident)}>
                  Edit
                </button>

                <button className="danger-btn" onClick={() => deleteIncident(incident._id)}>
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

export default IncidentReports;