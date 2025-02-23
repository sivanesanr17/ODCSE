require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Failed:", err));

// User Schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    otp: String,
    otpExpires: Date
});
const User = mongoose.model("User", UserSchema);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "odcsepsnacet@gmail.com", // Replace with your Gmail
        pass: "dmchigbzqyhhnkbj" // Replace with your App Password (NOT your Gmail password)
    }
});

// ✅ Forgot Password (Send OTP only if email exists)
app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ exists: false, error: "Email not found" });
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP email
    const mailOptions = {
        from: '"ODCSE Support" <alternativeusemail17@gmail.com>',
        to: email,
        subject: "Your OTP for Password Reset",
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
        html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ exists: true, message: "OTP sent successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error sending OTP" });
    }
});

// ✅ Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Invalid OTP or expired" });
    }

    res.json({ message: "OTP verified successfully!" });
});


// ✅ Login Route (Checks if user exists & verifies password)
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Check email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Check email or password" });
        }
        const token = jwt.sign({ userId: user._id }, "yourSecretKey", { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});



// Start Server
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));