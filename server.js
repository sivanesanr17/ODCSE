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
        html:`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #ffffff; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: center;">
            <h2 style="color: #4CAF50;">🔒 OTP Verification</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Use the OTP below to reset your password. This OTP is valid for <b>10 minutes</b>.</p>
            <div style="font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; background: #f4f4f4; display: inline-block; border-radius: 5px;">
                ${otp}
            </div>
            <p style="font-size: 14px; color: #666;">If you did not request this, please ignore this email.</p>
            <p style="font-size: 14px; color: #666;">Regards,<br>ODCSE Support</p>
        </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ exists: true, message: "OTP sent successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error sending OTP" });
    }
});

// ✅ Reset Password (Update in Database)
app.post("/api/auth/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character." });
    }

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Password reset successful!" });
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