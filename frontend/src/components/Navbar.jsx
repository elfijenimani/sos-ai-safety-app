import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-logo">SOS AI</div>

      <div className="nav-links">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/contacts">Contacts</NavLink>
        <NavLink to="/medical">Medical ID</NavLink>
        <NavLink to="/sos-history">SOS History</NavLink>
        <NavLink to="/safe-places">Safe Places</NavLink>
        <NavLink to="/checkins">Check-Ins</NavLink>
        <NavLink to="/assistant">Assistant</NavLink>
        <NavLink to="/incidents">Incidents</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;