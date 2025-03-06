const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // Import auth routes

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use(cors()); // Enable CORS for frontend

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use("/api/auth", authRoutes); // Use authentication routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
