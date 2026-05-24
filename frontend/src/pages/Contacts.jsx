import { useEffect, useState } from "react";
import api from "../services/api";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    relationship: "",
    notes: "",
    isPrimary: false,
  });

  const fetchContacts = async () => {
    try {
      const response = await api.get("/api/contacts");
      setContacts(response.data.contacts);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load contacts.");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      relationship: "",
      notes: "",
      isPrimary: false,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/api/contacts/${editingId}`, form);
        setMessage("Contact updated successfully.");
      } else {
        await api.post("/api/contacts", form);
        setMessage("Contact created successfully.");
      }

      resetForm();
      fetchContacts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Contact action failed.");
    }
  };

  const handleEdit = (contact) => {
    setEditingId(contact._id);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      relationship: contact.relationship || "",
      notes: contact.notes || "",
      isPrimary: contact.isPrimary || false,
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this contact?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/contacts/${id}`);
      setMessage("Contact deleted successfully.");
      fetchContacts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Emergency Contacts</h1>
        <p>Add and manage people who should be notified during an SOS alert.</p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="form-card">
        <h2>{editingId ? "Update Contact" : "Add Contact"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            name="name"
            placeholder="e.g. Mom"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Phone</label>
          <input
            name="phone"
            placeholder="e.g. +383..."
            value={form.phone}
            onChange={handleChange}
            required
          />

          <label>Relationship</label>
          <input
            name="relationship"
            placeholder="Mother, Brother, Friend..."
            value={form.relationship}
            onChange={handleChange}
          />

          <label>Notes</label>
          <textarea
            name="notes"
            placeholder="Important note..."
            value={form.notes}
            onChange={handleChange}
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="isPrimary"
              checked={form.isPrimary}
              onChange={handleChange}
            />
            Primary contact
          </label>

          <div className="button-row">
            <button className="primary-btn">
              {editingId ? "Update Contact" : "Add Contact"}
            </button>

            {editingId && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="list">
        {contacts.length === 0 ? (
          <p className="empty-text">No contacts yet.</p>
        ) : (
          contacts.map((contact) => (
            <div className="list-card" key={contact._id}>
              <div>
                <h3>
                  {contact.name} {contact.isPrimary && <span>⭐</span>}
                </h3>
                <p>{contact.phone}</p>
                <p>{contact.relationship}</p>
                <small>{contact.notes}</small>
              </div>

              <div className="button-column">
                <button className="secondary-btn" onClick={() => handleEdit(contact)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => handleDelete(contact._id)}>
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

export default Contacts;