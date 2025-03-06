const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const User = require("../models/User");
const OTP = require("../models/Otp");

dotenv.config();
const router = express.Router();

// 🔹 Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 🔹 Generate and Hash OTP
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ✅ **Forgot Password - Send OTP**
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ exists: false, message: "Email not registered." });
        }

        // Generate OTP and hash it
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10); // Hash OTP before storing

        await OTP.findOneAndUpdate(
            { email },
            { otp: hashedOtp, createdAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 }, // Expires in 5 minutes
            { upsert: true, new: true }
        );

        // Send OTP via email
        const mailOptions = {
            from: `"ODCSE Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify Your Login",
            text: `Below is your one-time passcode: ${otp}`,
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
                    
                    <!-- Outer Email Container -->
                    <div style="max-width: 400px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 5px; 
                                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: center;">
        
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 110px;">
                        </div>
        
                        <!-- Header Text -->
                        <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 10px;">Verify your login</h2>
        
                        <!-- Body Text -->
                        <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                            Below is your one-time passcode:
                        </p>
        
                        <!-- OTP (Centered and Spaced Out) -->
                        <p style="font-size: 24px; font-weight: bold; color: #000000; text-align: center; letter-spacing: 8px; margin: 0;">
                            ${otp.toString().split("").join(" ")}
                        </p>
        
                        <!-- Help Text -->
                        <p style="font-size: 14px; color: #666666; margin-top: 20px;">
                            We're here to help if you need it. Visit the 
                            <a href="#" style="color: #0066cc; text-decoration: none;">ODCSE Support</a> for more info or 
                            <a href="#" style="color: #0066cc; text-decoration: none;">contact us</a>.
                        </p>
        
                        <!-- Footer -->
                        <p style="font-size: 14px; color: #888888; margin-top: 20px;">– ODCSE Security</p>
                    </div>
                </div>
            ` 
        };
        
        
        

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`); // Debugging log

        res.json({ exists: true, message: "OTP sent! Check your email." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ✅ **Verify OTP**
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
        if (!otpRecord) {
            return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
        }

        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        if (otpRecord.expiresAt < Date.now()) {
            await OTP.deleteOne({ email: email.toLowerCase() });
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        res.json({ verified: true, otpToken: otpRecord.otp });  // ✅ Send OTP token back
    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
router.post("/reset-password", async (req, res) => {
    try {
        const { email, password, otpToken } = req.body;

        if (!email || !password || !otpToken) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
        if (!otpRecord) {
            return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
        }

        const isOtpValid = otpToken === otpRecord.otp;  // ✅ Compare stored OTP token
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP token." });
        }

        if (otpRecord.expiresAt < Date.now()) {
            await OTP.deleteOne({ email: email.toLowerCase() });
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updateOne({ email: email.toLowerCase() }, { $set: { password: hashedPassword } });

        await OTP.deleteOne({ email: email.toLowerCase() });

        res.json({ success: true, message: "Password successfully reset! You can now log in." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});


// ✅ **Login**
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
