const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const sosRoutes = require("./routes/sosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const safePlaceRoutes = require("./routes/safePlaceRoutes");
const checkInRoutes = require("./routes/checkInRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

dotenv.config();

connectDB();

const app = express();
const incidentRoutes = require("./routes/incidentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.send("SOS AI Safety App Backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/safe-places", safePlaceRoutes);
app.use("/api/checkins", checkInRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;