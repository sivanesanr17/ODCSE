const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const User = require("../models/User");
const OTP = require("../models/Otp");
const Staff = require("../models/Staff");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
//Perumal Yogesh
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
    let user = await User.findOne({ email });
    if (!user) {
      user = await Staff.findOne({ email });
    }
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
      subject: "Verify Your OTP",
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
            <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 10px;">Your OTP</h2>
            <!-- Body Text -->
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              Below is your one-time passcode
            </p>
            <!-- OTP (Centered and Spaced Out) -->
            <p style="font-size: 24px; font-weight: bold; color: #000000; text-align: center; letter-spacing: 8px; margin: 0;">
              ${otp.toString().split("").join(" ")}
            </p>
            <!-- Help Text -->
            <p style="font-size: 14px; color: #666666; margin-top: 20px;">
              This OTP is valid for 5 minutes and should not be shared with anyone. 
              If you did not request this OTP, please ignore this email.
            </p>
            <!-- Footer -->
            <p style="font-size: 14px; color: #888888; margin-top: 20px;">– ODCSE Support</p>
          </div>
        </div>
      `,
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

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }

    res.json({ verified: true, otpToken: otpRecord.otp });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✅ **Reset Password**
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password, otpToken } = req.body;

    if (!email || !password || !otpToken) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check in both users and staff collections
    let user = await User.findOne({ email });
    let collection = User; // Default to User collection

    if (!user) {
      user = await Staff.findOne({ email });
      collection = Staff; // If found in Staff, update collection reference
    }

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
    }

    const isOtpValid = otpToken === otpRecord.otp;
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP token." });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await collection.updateOne({ email }, { $set: { password: hashedPassword } }); // ✅ Uses the correct collection

    await OTP.deleteOne({ email });

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
    let user = await User.findOne({ email });
    let role = "user";

    if (!user) {
      user = await Staff.findOne({ email });
      role = "staff";
    }

    if (!user) {
      user = await Admin.findOne({ email }); // Check in Admin collection
      role = "admin";
    }

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, email: user.email, role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token, role, name: user.name });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ **Profile**
// ✅ Get Profile Based on Role
router.get("/user", async (req, res) => {
  const { email } = req.query;

  try {
    const staff = await Staff.findOne({ email });
    if (staff) {
      return res.json(staff);
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.json(user);
    }

    res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ API to get the list of staff
router.get("/staff-list", async (req, res) => {
  try {
    const staffList = await Staff.find();
    res.json(staffList);
  } catch (error) {
    res.status(500).send("Failed to fetch staff list");
  }
});

// ✅ API to update the tutor name
router.put("/update-tutor", async (req, res) => {
  const { email, tutorName, studentName, semester } = req.body;
  
  if (!tutorName) {
    return res.status(400).send("Tutor Name is required");
  }

  try {
    // ✅ Update the tutor name in the database (User collection)
    const result = await User.updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { tutorName } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("User not found");
    }

    // ✅ Fetch the tutor's email from the Staff collection
    const tutor = await Staff.findOne({ name: tutorName });
    if (!tutor) {
      return res.status(404).send("Tutor not found");
    }

    // ✅ Send email notification to the tutor
    const mailOptions = {
      from: `"ODCSE Support" <${process.env.EMAIL_USER}>`,
      to: tutor.email,
      subject: "Tutor Assignment Notification",
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 30px; text-align: center;">
          <!-- Outer Email Container -->
          <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 20px; border-radius: 6px; 
                      box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1); text-align: center;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 12px;">
              <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 90px;">
            </div>
            <!-- Header Text -->
            <h2 style="color: #000000; font-size: 18px; font-weight: 600; margin-bottom: 6px;">Added You As Tutor</h2>
            <!-- Body Text -->
            <p style="font-size: 14px; color: #333333; margin-bottom: 12px; text-align: center;">
              We are pleased to inform you that <strong>${studentName}</strong>, a student currently in their <strong>${semester} semester</strong>, has added you as their official tutor. 
              Moving forward, all OD (On-Duty) requests from this student will be directed to your email for review and approval. 
              Kindly acknowledge those OD requests and provide your support as needed.
            </p>
            <!-- Footer -->
            <p style="font-size: 12px; color: #888888; margin-top: 12px;">- ODCSE Support</p>
          </div>
        </div>
      `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send email:", error);
        return res.status(500).send("Tutor name updated but email not sent.");
      }
      console.log("Email sent: " + info.response);
      res.send("Tutor name updated successfully and email notification sent.");
    });

  } catch (error) {
    console.error("Error updating tutor:", error);
    res.status(500).send("Failed to update tutor name");
  }
});


module.exports = router;