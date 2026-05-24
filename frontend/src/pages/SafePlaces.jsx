import { useEffect, useState } from "react";
import api from "../services/api";

function SafePlaces() {
  const [safePlaces, setSafePlaces] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [nearestPlace, setNearestPlace] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingNearest, setLoadingNearest] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "Home",
    address: "",
    latitude: "",
    longitude: "",
    notes: "",
    isPrimarySafePlace: false,
  });

  const fetchSafePlaces = async () => {
    try {
      const response = await api.get("/api/safe-places");
      setSafePlaces(response.data.safePlaces);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load safe places.");
    }
  };

  useEffect(() => {
    fetchSafePlaces();
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
      type: "Home",
      address: "",
      latitude: "",
      longitude: "",
      notes: "",
      isPrimarySafePlace: false,
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };

    try {
      if (editingId) {
        await api.put(`/api/safe-places/${editingId}`, payload);
        setMessage("Safe place updated successfully.");
      } else {
        await api.post("/api/safe-places", payload);
        setMessage("Safe place created successfully.");
      }

      resetForm();
      fetchSafePlaces();
    } catch (error) {
      setMessage(error.response?.data?.message || "Safe place action failed.");
    }
  };

  const handleEdit = (place) => {
    setEditingId(place._id);

    setForm({
      name: place.name || "",
      type: place.type || "Other",
      address: place.address || "",
      latitude: place.latitude || "",
      longitude: place.longitude || "",
      notes: place.notes || "",
      isPrimarySafePlace: place.isPrimarySafePlace || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this safe place?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/safe-places/${id}`);
      setMessage("Safe place deleted successfully.");
      fetchSafePlaces();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  };

  const findNearestWithDemoLocation = async () => {
    setMessage("");
    setLoadingNearest(true);

    try {
      const response = await api.get(
        "/api/safe-places/nearest?lat=42.870000&lng=20.876000"
      );

      setNearestPlace(response.data.nearestSafePlace);
      setMessage("Nearest safe place found using demo location.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not find nearest safe place.");
    } finally {
      setLoadingNearest(false);
    }
  };

  const findNearestWithCurrentLocation = () => {
    setMessage("");
    setLoadingNearest(true);

    if (!navigator.geolocation) {
      setLoadingNearest(false);
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const response = await api.get(
            `/api/safe-places/nearest?lat=${lat}&lng=${lng}`
          );

          setNearestPlace(response.data.nearestSafePlace);
          setMessage("Nearest safe place found using your current location.");
        } catch (error) {
          setMessage(error.response?.data?.message || "Could not find nearest safe place.");
        } finally {
          setLoadingNearest(false);
        }
      },
      () => {
        setLoadingNearest(false);
        setMessage("Location permission denied. Try demo location instead.");
      }
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Location Safety Module</p>
        <h1>Safe Places</h1>
        <p>
          Save trusted locations such as home, university, hospital or police station.
          The app can calculate the nearest safe place during an emergency.
        </p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="safe-place-overview">
        <div className="professional-card">
          <h2>Nearest Safe Place</h2>
          <p className="muted-text">
            Use your current location or demo location to calculate the closest safe place.
          </p>

          <div className="button-row">
            <button
              className="primary-btn"
              onClick={findNearestWithCurrentLocation}
              disabled={loadingNearest}
            >
              {loadingNearest ? "Checking..." : "Use Current Location"}
            </button>

            <button
              className="secondary-btn"
              onClick={findNearestWithDemoLocation}
              disabled={loadingNearest}
            >
              Demo Location
            </button>
          </div>

          {nearestPlace && (
            <div className="nearest-card">
              <span>📍</span>
              <div>
                <h3>{nearestPlace.name}</h3>
                <p>{nearestPlace.type}</p>
                <p>{nearestPlace.address}</p>
                <strong>{nearestPlace.distanceKm} km away</strong>
              </div>
            </div>
          )}
        </div>

        <div className="professional-card">
          <h2>Why Safe Places?</h2>
          <p className="muted-text">
            In a real emergency, knowing the nearest trusted location can help the user
            decide where to go faster and safer.
          </p>

          <div className="mini-stats">
            <div>
              <strong>{safePlaces.length}</strong>
              <span>Total places</span>
            </div>

            <div>
              <strong>
                {safePlaces.filter((place) => place.isPrimarySafePlace).length}
              </strong>
              <span>Primary places</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h2>{editingId ? "Update Safe Place" : "Add Safe Place"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            name="name"
            placeholder="e.g. Home, University, Hospital"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="Home">Home</option>
            <option value="University">University</option>
            <option value="Work">Work</option>
            <option value="Hospital">Hospital</option>
            <option value="Police Station">Police Station</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>

          <label>Address</label>
          <input
            name="address"
            placeholder="e.g. Mitrovica, Kosovo"
            value={form.address}
            onChange={handleChange}
          />

          <div className="two-column-form">
            <div>
              <label>Latitude</label>
              <input
                name="latitude"
                placeholder="e.g. 42.870307"
                value={form.latitude}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Longitude</label>
              <input
                name="longitude"
                placeholder="e.g. 20.876545"
                value={form.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label>Notes</label>
          <textarea
            name="notes"
            placeholder="Why is this place safe?"
            value={form.notes}
            onChange={handleChange}
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="isPrimarySafePlace"
              checked={form.isPrimarySafePlace}
              onChange={handleChange}
            />
            Primary safe place
          </label>

          <div className="button-row">
            <button className="primary-btn">
              {editingId ? "Update Safe Place" : "Add Safe Place"}
            </button>

            {editingId && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="section-row">
        <div className="section-title">
          <h2>Saved Safe Places</h2>
          <p>Locations stored in MongoDB and protected by your account.</p>
        </div>
      </div>

      <div className="list">
        {safePlaces.length === 0 ? (
          <p className="empty-text">No safe places yet.</p>
        ) : (
          safePlaces.map((place) => (
            <div className="list-card" key={place._id}>
              <div>
                <h3>
                  {place.name} {place.isPrimarySafePlace && <span>⭐</span>}
                </h3>

                <p>{place.type}</p>
                <p>{place.address}</p>
                <p>
                  Location: {place.latitude}, {place.longitude}
                </p>

                <a
                  href={`https://maps.google.com/?q=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>

                <small>{place.notes}</small>
              </div>

              <div className="button-column">
                <button className="secondary-btn" onClick={() => handleEdit(place)}>
                  Edit
                </button>

                <button className="danger-btn" onClick={() => handleDelete(place._id)}>
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

export default SafePlaces;