import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import MedicalID from "./pages/MedicalID";
import SOSHistory from "./pages/SOSHistory";
import SafePlaces from "./pages/SafePlaces";
import CheckIns from "./pages/CheckIns";
import SafetyAssistant from "./pages/SafetyAssistant";
import IncidentReports from "./pages/IncidentReports";
import EmergencyNotifications from "./pages/EmergencyNotifications";

function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/medical"
          element={
            <ProtectedRoute>
              <MedicalID />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sos-history"
          element={
            <ProtectedRoute>
              <SOSHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safe-places"
          element={
            <ProtectedRoute>
              <SafePlaces />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkins"
          element={
            <ProtectedRoute>
              <CheckIns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <SafetyAssistant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <IncidentReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <EmergencyNotifications />
            </ProtectedRoute>
           }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;