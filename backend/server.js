require('dotenv').config(); // Should be FIRST line to ensure env vars are loaded
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "http://localhost:3000", // Specify allowed origin
  credentials: true // If using cookies/sessions
}));

// Security middleware
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// MongoDB Connection with improved configuration
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/odcse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000 // Close sockets after 45s of inactivity
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1); // Exit process on connection failure
});

// Routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));