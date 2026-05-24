import { useEffect, useState } from "react";
import api from "../services/api";

function MedicalID() {
  const [profileExists, setProfileExists] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    notes: "",
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/medical");
      const profile = response.data.medicalProfile;

      setForm({
        fullName: profile.fullName || "",
        birthDate: profile.birthDate || "",
        bloodType: profile.bloodType || "",
        allergies: profile.allergies || "",
        medicalConditions: profile.medicalConditions || "",
        medications: profile.medications || "",
        notes: profile.notes || "",
      });

      setProfileExists(true);
    } catch (error) {
      setProfileExists(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (profileExists) {
        await api.put("/api/medical", form);
        setMessage("Medical profile updated successfully.");
      } else {
        await api.post("/api/medical", form);
        setMessage("Medical profile created successfully.");
        setProfileExists(true);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Medical profile action failed.");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete Medical ID?");
    if (!confirmDelete) return;

    try {
      await api.delete("/api/medical");
      setMessage("Medical profile deleted successfully.");
      setProfileExists(false);
      setForm({
        fullName: "",
        birthDate: "",
        bloodType: "",
        allergies: "",
        medicalConditions: "",
        medications: "",
        notes: "",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Medical ID</h1>
        <p>Store important medical information for emergencies.</p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="form-card">
        <form onSubmit={handleSave}>
          <label>Full Name</label>
          <input
            name="fullName"
            placeholder="e.g. Rozafa Hajrizi"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <label>Birth Date</label>
          <input
            name="birthDate"
            placeholder="e.g. 18/08/2004"
            value={form.birthDate}
            onChange={handleChange}
          />

          <label>Blood Type</label>
          <input
            name="bloodType"
            placeholder="e.g. O+, A-, B+"
            value={form.bloodType}
            onChange={handleChange}
          />

          <label>Allergies</label>
          <textarea
            name="allergies"
            placeholder="e.g. penicillin, nuts..."
            value={form.allergies}
            onChange={handleChange}
          />

          <label>Medical Conditions</label>
          <textarea
            name="medicalConditions"
            placeholder="e.g. asthma, diabetes..."
            value={form.medicalConditions}
            onChange={handleChange}
          />

          <label>Medications</label>
          <textarea
            name="medications"
            placeholder="e.g. insulin, inhaler..."
            value={form.medications}
            onChange={handleChange}
          />

          <label>Notes</label>
          <textarea
            name="notes"
            placeholder="Anything important..."
            value={form.notes}
            onChange={handleChange}
          />

          <div className="button-row">
            <button className="primary-btn">
              {profileExists ? "Update Medical ID" : "Create Medical ID"}
            </button>

            {profileExists && (
              <button type="button" className="danger-btn" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalID;