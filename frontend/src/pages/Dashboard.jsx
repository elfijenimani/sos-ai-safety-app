import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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

const getCurrentLocationPromise = () => {
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

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosLoading, setSosLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/dashboard/stats");
      setStats(response.data.stats);
      setLastUpdated(new Date());
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      const location = await getCurrentLocationPromise();
      setLiveLocation(location);
      setMessage("Live location detected successfully.");
    } catch {
      setLiveLocation(null);
      setMessage("Live location was not available. Demo location can still be used.");
    }
  };

  useEffect(() => {
    fetchStats();
    detectLocation();
  }, []);

  const riskClass = useMemo(() => {
    if (!stats) return "risk-low";
    if (stats.riskLevel === "HIGH") return "risk-high";
    if (stats.riskLevel === "MEDIUM") return "risk-medium";
    return "risk-low";
  }, [stats]);

  const readableRiskLevel = useMemo(() => {
    if (!stats?.riskLevel) return "Low Risk";

    if (stats.riskLevel === "HIGH") return "High Risk";
    if (stats.riskLevel === "MEDIUM") return "Medium Risk";

    return "Low Risk";
  }, [stats]);

  const riskDescription = useMemo(() => {
    if (!stats?.riskLevel) return "Your safety setup looks stable.";

    if (stats.riskLevel === "HIGH") {
      return "Your safety setup needs urgent attention.";
    }

    if (stats.riskLevel === "MEDIUM") {
      return "Your safety setup is improving, but still needs attention.";
    }

    return "Your safety setup looks stable right now.";
  }, [stats]);

  const safetyReadinessScore = useMemo(() => {
    if (!stats) return 0;

    if (stats.safetyReadinessScore !== undefined) {
      return stats.safetyReadinessScore;
    }

    let score = 100;

    if ((stats.totalContacts || 0) < 2) score -= 20;
    if ((stats.primaryContacts || 0) === 0) score -= 10;
    if (!stats.hasMedicalProfile) score -= 15;
    if ((stats.totalSafePlaces || 0) === 0) score -= 15;
    if ((stats.pendingSosEvents || 0) > 0) score -= 10;
    if ((stats.missedCheckIns || 0) > 0) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [stats]);

  const safetyReadinessTasks = useMemo(() => {
    if (!stats) return [];

    const tasks = [];

    if ((stats.totalContacts || 0) < 2) {
      tasks.push("Add emergency contacts");
    }

    if ((stats.primaryContacts || 0) === 0) {
      tasks.push("Set primary contact");
    }

    if (!stats.hasMedicalProfile) {
      tasks.push("Complete Medical ID");
    }

    if ((stats.totalSafePlaces || 0) === 0) {
      tasks.push("Add safe places");
    }

    if ((stats.pendingSosEvents || 0) > 0) {
      tasks.push("Complete pending SOS");
    }

    if ((stats.missedCheckIns || 0) > 0) {
      tasks.push("Review missed check-ins");
    }

    if (tasks.length === 0) {
      tasks.push("Safety profile is strong");
    }

    return tasks;
  }, [stats]);

  const createQuickSos = async () => {
    setMessage("");
    setSosLoading(true);

    const fallbackLocation = {
      latitude: 42.870307,
      longitude: 20.876545,
    };

    try {
      let location = liveLocation || fallbackLocation;

      try {
        location = await getCurrentLocationPromise();
        setLiveLocation(location);
      } catch {
        setMessage("Location permission denied. Demo location will be used.");
      }

      const contactsResponse = await api.get("/api/contacts");
      const contacts = contactsResponse.data.contacts || [];

      if (contacts.length === 0) {
        setMessage("No emergency contacts found. Please add contacts first.");
        setSosLoading(false);
        return;
      }

      const primaryContact =
        contacts.find((contact) => contact.isPrimary) || contacts[0];

      const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

      const smsMessage = `SOS ALERT from GuardianAI.
I may need help.

My location:
${googleMapsUrl}`;

      await api.post("/api/sos", {
        type: "Manual SOS",
        latitude: location.latitude,
        longitude: location.longitude,
        googleMapsUrl,
        message: smsMessage,
        contactsNotified: contacts.map(
          (contact) => `${contact.name} (${normalizePhoneNumber(contact.phone)})`
        ),
        status: "Pending",
        notes:
          "Quick SOS opened SMS app. User must press Send manually from the phone.",
      });

      setMessage(
        `Opening SMS for ${primaryContact.name}. Press Send to notify this contact.`
      );

      fetchStats();

      const smsUrl = buildSmsUrl(primaryContact.phone, smsMessage);

      setTimeout(() => {
        window.location.href = smsUrl;
      }, 600);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to open SMS app.");
    } finally {
      setSosLoading(false);
    }
  };

  const readinessItems = [
    {
      label: "Emergency Contacts",
      ready: stats?.totalContacts >= 2,
      detail: `${stats?.totalContacts || 0} saved`,
    },
    {
      label: "Primary Contact",
      ready: stats?.primaryContacts > 0,
      detail: `${stats?.primaryContacts || 0} primary`,
    },
    {
      label: "Medical ID",
      ready: stats?.hasMedicalProfile,
      detail: stats?.hasMedicalProfile ? "Completed" : "Missing",
    },
    {
      label: "Safe Places",
      ready: stats?.totalSafePlaces > 0,
      detail: `${stats?.totalSafePlaces || 0} saved`,
    },
    {
      label: "Safety Check-Ins",
      ready: stats?.totalCheckIns > 0,
      detail: `${stats?.totalCheckIns || 0} created`,
    },
    {
      label: "Pending SOS",
      ready: stats?.pendingSosEvents === 0,
      detail: `${stats?.pendingSosEvents || 0} pending`,
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="hero-card">
          <p className="eyebrow">Loading Dashboard</p>
          <h1>Preparing GuardianAI...</h1>
          <p>Loading your intelligent emergency safety dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <section className="advanced-hero">
        <div>
          <p className="eyebrow">Smart Personal Safety Platform</p>
          <h1>GuardianAI Safety Center</h1>

          <p>
            Welcome, <strong>{user?.name || "User"}</strong>. Your dashboard analyzes
            emergency contacts, Medical ID, SOS events, safe places and check-ins
            to estimate your safety readiness.
          </p>

          {lastUpdated && (
            <p>
              Last updated: <strong>{lastUpdated.toLocaleString()}</strong>
            </p>
          )}

          {message && <div className="message-box hero-message">{message}</div>}

          <div className="hero-actions">
            <button
              className="sos-main-btn"
              onClick={createQuickSos}
              disabled={sosLoading}
            >
              {sosLoading ? "Opening SMS..." : "🚨 Quick SOS"}
            </button>

            <Link to="/checkins" className="hero-link-btn">
              Start Check-In
            </Link>

            <Link to="/safe-places" className="hero-link-btn">
              Safe Places
            </Link>

            <button className="hero-link-btn" onClick={fetchStats}>
              Refresh
            </button>
          </div>
        </div>

        <div className={`risk-panel ${riskClass}`}>
          <span>AI Risk Score</span>
          <strong>{stats?.riskScore || 0}/100</strong>
          <p>{readableRiskLevel}</p>
          <small>{riskDescription}</small>
        </div>
      </section>

      <section className="intelligence-grid">
        <div className="professional-card">
          <div className="section-title">
            <h2>Profile Completion</h2>
            <p>Your emergency profile readiness level.</p>
          </div>

          <div className="completion-number">{stats?.completionScore || 0}%</div>

          <div className="completion-bar">
            <div style={{ width: `${stats?.completionScore || 0}%` }} />
          </div>

          <p className="muted-text">
            Status: <strong>{stats?.safetyStatus || "Improving"}</strong>
          </p>
        </div>

        <div className="professional-card">
          <div className="section-title">
            <h2>Safety Readiness Score</h2>
            <p>Calculated from your most important emergency setup items.</p>
          </div>

          <div className="completion-number">{safetyReadinessScore}%</div>

          <div className="completion-bar">
            <div style={{ width: `${safetyReadinessScore}%` }} />
          </div>

          <p className="muted-text">
            {safetyReadinessTasks.join(" · ")}
          </p>
        </div>
      </section>

      <section className="dashboard-split">
        <div className="professional-card">
          <div className="section-title">
            <h2>AI Safety Recommendations</h2>
            <p>Generated based on your emergency data and risk factors.</p>
          </div>

          <div className="recommendations-list">
            {stats?.recommendations?.length > 0 ? (
              stats.recommendations.map((item, index) => (
                <div className="recommendation-card" key={index}>
                  <span
                    className={`priority-pill priority-${item.priority?.toLowerCase()}`}
                  >
                    {item.priority}
                  </span>

                  <h3>{item.title}</h3>
                  <p>{item.message}</p>
                </div>
              ))
            ) : (
              <p className="empty-text">No recommendations available right now.</p>
            )}
          </div>
        </div>

        <div className="professional-card">
          <div className="section-title">
            <h2>Safety Readiness</h2>
            <p>Important checks for emergency preparation.</p>
          </div>

          <div className="readiness-list">
            {readinessItems.map((item) => (
              <div className="readiness-row" key={item.label}>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.detail}</p>
                </div>

                <span className={item.ready ? "badge-ready" : "badge-warning"}>
                  {item.ready ? "Ready" : "Action needed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <div className="professional-card">
          <div className="section-row">
            <div className="section-title">
              <h2>Recent SOS Activity</h2>
              <p>Latest emergency events saved in MongoDB.</p>
            </div>

            <Link to="/sos-history" className="mini-link">
              Open all
            </Link>
          </div>

          {stats?.recentSosEvents?.length === 0 ? (
            <p className="empty-text">No recent SOS events yet.</p>
          ) : (
            <div className="recent-list">
              {stats?.recentSosEvents?.map((event) => (
                <div className="recent-item" key={event._id}>
                  <div>
                    <h3>{event.type}</h3>
                    <p>
                      {event.latitude}, {event.longitude}
                    </p>
                    <small>{new Date(event.createdAt).toLocaleString()}</small>
                  </div>

                  <div className="recent-actions">
                    <span
                      className={`status-pill status-${event.status?.toLowerCase()}`}
                    >
                      {event.status}
                    </span>

                    {event.googleMapsUrl && (
                      <a href={event.googleMapsUrl} target="_blank" rel="noreferrer">
                        Map
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="professional-card">
          <div className="section-row">
            <div className="section-title">
              <h2>Recent Check-Ins</h2>
              <p>Latest safety check-ins and statuses.</p>
            </div>

            <Link to="/checkins" className="mini-link">
              Open all
            </Link>
          </div>

          {stats?.recentCheckIns?.length === 0 ? (
            <p className="empty-text">No recent check-ins yet.</p>
          ) : (
            <div className="recent-list">
              {stats?.recentCheckIns?.map((checkIn) => (
                <div className="recent-item" key={checkIn._id}>
                  <div>
                    <h3>{checkIn.title}</h3>
                    <p>{checkIn.destinationName}</p>

                    {checkIn.expectedArrivalTime && (
                      <small>
                        Expected:{" "}
                        {new Date(checkIn.expectedArrivalTime).toLocaleString()}
                      </small>
                    )}
                  </div>

                  <span
                    className={`status-pill status-${checkIn.status?.toLowerCase()}`}
                  >
                    {checkIn.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;