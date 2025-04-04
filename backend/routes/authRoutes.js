const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const User = require("../models/User");
const OTP = require("../models/Otp");
const Staff = require("../models/Staff");
const Admin = require("../models/Admin");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const cloudinary = require('cloudinary').v2;
const Invitation = require('../models/Invitation');
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 🔹 Generate and Hash OTP
const generateOtp = () => crypto.randomInt(100000, 999999).toString();
// Configure storage for uploaded files

// 🔹 Send response notification email
const sendResponseNotificationEmail = async (invitation) => {
  try {
    const mailOptions = {
      from: `"OD System" <${process.env.EMAIL_USER}>`,
      to: invitation.requesterEmail,
      subject: `Invitation ${invitation.status} for ${invitation.eventName}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
          <!-- Outer Email Container -->
          <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; 
                      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: left;">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 100px;">
            </div>
            
            <!-- Header Text -->
            <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 20px; text-align: center;">OD Request Invitation Update</h2>
            
            <!-- Main Content -->
            <p style="font-size: 15px; color: #333333; margin-bottom: 15px;">
              Your invitation to <strong>${invitation.recipientEmail}</strong> for the event
              <strong style="font-size: 14px;">${invitation.eventName}</strong> has been 
              <strong style="color: ${invitation.status === 'accepted' ? '#4CAF50' : '#f44336'}">${invitation.status}</strong>.
            </p>
            
            <!-- Details Box -->
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; color: #000000;">
              <p style="margin-top: 0; font-weight: 600;">Details:</p>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;">Event: ${invitation.eventName}</li>
                <li style="margin-bottom: 5px;">Dates: ${new Date(invitation.fromDate).toLocaleDateString()} - ${new Date(invitation.toDate).toLocaleDateString()}</li>
                <li style="margin-bottom: 5px;">Status: <span style="color: ${invitation.status === 'accepted' ? '#4CAF50' : '#f44336'}">${invitation.status}</span></li>
                <li>Responded at: ${new Date(invitation.respondedAt).toLocaleString()}</li>
              </ul>
            </div>
            
            <!-- Additional Information -->
            <p style="font-size: 15px; color: #333333; margin-bottom: 10px;">
              You can view the updated status in your OD dashboard.
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center;">
              <p>This is an automated message. Please do not reply directly to this email.</p>
              <p>– ODCSE Support</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending response notification email:', error);
    throw error;
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Add this middleware function at the top of your file
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});


// ✅ Create Event with File Upload
router.post('/add-events', upload.single('file'), async (req, res) => {
  try {
    const { name, description, venue, registrationStart, registrationEnd } = req.body;
    
    // Validate required fields
    if (!name || !description || !venue || !registrationStart || !registrationEnd || !req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields including file upload are required' 
      });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'event-posters', // Optional folder in Cloudinary
      resource_type: 'auto' // Automatically detect image or other file types
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Validate registration dates
    const startDate = new Date(registrationStart);
    const endDate = new Date(registrationEnd);
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration end date must be after start date'
      });
    }

    // Create and save event with Cloudinary URL
    const newEvent = new Event({
      name,
      description,
      venue, // Added venue field
      registrationStart,
      registrationEnd,
      fileName: req.file.originalname,
      filePath: result.secure_url, // Store the Cloudinary URL
      fileType: req.file.mimetype,
      cloudinaryPublicId: result.public_id // Store for future management
    });

    const savedEvent = await newEvent.save();

    return res.status(201).json({
      success: true,
      message: 'Event uploaded successfully',
      event: savedEvent
    });

  } catch (error) {
    console.error('Error in event creation:', error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error processing event upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single event for editing
router.get("/edit-events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        venue: event.venue,
        date: event.date,
        registrationStart: event.registrationStart,
        registrationEnd: event.registrationEnd,
        filePath: event.filePath
      }
    });

  } catch (error) {
    console.error("Error fetching event for editing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Update event
router.put('/edit-events/:id', upload.single('file'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update fields if they exist in the request
    const fields = ['name', 'description', 'venue', 'date', 'registrationStart', 'registrationEnd'];
    fields.forEach(field => {
      if (req.body[field]) {
        event[field] = req.body[field];
      }
    });

    // Update file if a new one was uploaded
    if (req.file) {
      // Delete old file if it exists
      if (event.filePath) {
        const oldFilePath = path.join(__dirname, '..', event.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      event.filePath = `/uploads/events/${req.file.filename}`;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ error: error.message || 'Failed to update event' });
  }
});

// Delete event
// Change this in your backend
router.delete("/remove-events/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found or already deleted"
      });
    }

    res.status(200).json({
      success: true,
      message: `Event "${deletedEvent.name}" deleted successfully`,
      deletedEvent: {
        id: deletedEvent._id,
        name: deletedEvent.name
      }
    });

  } catch (error) {
    console.error("Event deletion error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete event",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

router.get('/get-events', async (req, res) => {
  try {
    const events = await Event.find({}).sort({ registrationStart: 1 }).lean();
    
    res.status(200).json({
      success: true,
      events: events.map(event => ({
        _id: event._id,
        name: event.name,
        description: event.description,
        date: event.date || event.registrationStart,
        venue:event.venue,
        filePath: event.filePath || "https://via.placeholder.com/300",
      }))
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching events'
    });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        venue: event.venue,
        registrationStart: event.registrationStart,
        registrationEnd: event.registrationEnd,
        filePath: event.filePath || "https://via.placeholder.com/300",
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching event details'
    });
  }
});

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
// Send OTP via email
const mailOptions = {
  from: `"ODCSE Support" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Verify Your OTP",
  text: `Below is your one-time passcode: ${otp}`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
      <!-- Outer Email Container -->
      <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; 
                  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: center;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 110px;">
        </div>
        
        <!-- Header Text -->
        <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 20px;">Your OTP Code</h2>
        
        <!-- Main Content -->
        <p style="font-size: 15px; color: #333333; margin-bottom: 15px;">
          Please use the OTP below to proceed. This code is valid for <strong>5 minutes</strong>.
        </p>
        
        <!-- OTP Box -->
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 20px; 
                    font-weight: bold; color: #000000; letter-spacing: 7px;">
          ${otp.toString().split("").join(" ")}
        </div>

        
        <!-- Help Text -->
        <p style="font-size: 14px; color: #888888; margin-top: 20px;">
          If you did not request this OTP, you can safely ignore this email.
        </p>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 12px; color: #aaaaaa;">© 2025 ODCSE Support. All rights reserved.</p>
        </div>
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

// ✅ API to get the list of staff (improved version)
router.get("/staff-list", async (req, res) => {
  try {
    const staffMembers = await Staff.find({}, 'name department email'); // Only get necessary fields
    res.json(staffMembers);
  } catch (error) {
    console.error("Error fetching staff list:", error);
    res.status(500).json({ error: "Failed to fetch staff list" });
  }
});

// ✅ Add Student (Admin Only)
// authRoutes.js
router.post("/add-student", async (req, res) => {
  try {
    const { name, registerNumber, semester, tutorName, email, password } = req.body;

    // 1️⃣ Check if student exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2️⃣ Find tutor in STAFF collection (not User)
    const tutor = await Staff.findById(tutorName).select("name");
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found in staff records" });
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4️⃣ Save student with tutor's NAME (not ID)
    const newStudent = new User({
      name,
      registerNumber,
      semester: parseInt(semester),
      tutorName: tutor.name, // ✅ Now stores NAME, not ID
      email,
      password: hashedPassword,
      role: "user",
    });

    await newStudent.save();

    res.status(201).json({ 
      success: true,
      message: "Student registered successfully",
      studentId: newStudent._id,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error. Check if tutor exists.",
      error: error.message,
    });
  }
});

// ✅ Add Staff (Admin Only)
// authRoutes.js
// routes/auth.js
router.post("/add-staff", upload.single('signature'), async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log the parsed body
    console.log('Request file:', req.file); // Log the uploaded file

    const { name, email, password, staffID, designation } = req.body;
    const department = "Computer Science and Engineering";
    
    // Validate input
    if (!name || !email || !password || !staffID || !designation) {
      console.log('Missing fields:', {
        name: !!name,
        email: !!email,
        password: !!password,
        staffID: !!staffID,
        designation: !!designation
      });
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if staff exists
    const existingStaff = await Staff.findOne({ 
      $or: [{ email }, { staffID }] 
    });
    
    if (existingStaff) {
      return res.status(400).json({ 
        success: false,
        message: "Staff already exists"
      });
    }

    // Upload signature to Cloudinary if exists
    let signatureData = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'staff-signatures',
        transformation: [
          { width: 300, height: 100, crop: "limit" },
          { quality: "auto:good" }
        ]
      });
      
      signatureData = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Delete the temporary file
      fs.unlinkSync(req.file.path);
    }

    // Create new staff
    const newStaff = new Staff({
      name,
      email,
      password,
      staffID,
      designation,
      department,
      signature: signatureData
    });

    await newStaff.save();

    // Remove sensitive data before sending response
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;
    delete staffResponse.__v;

    res.status(201).json({ 
      success: true,
      message: "Staff registered successfully",
      data: staffResponse
    });

  } catch (error) {
    console.error("Staff registration error:", error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
});

// Get Student by Register Number
router.get("/get-student/:registerNumber", async (req, res) => {
  try {
    const student = await User.findOne({ 
      registerNumber: req.params.registerNumber 
    }).select('-password -__v');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error("Student fetch error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
});

// Get Staff by Staff ID
router.get("/get-staff/:staffID", async (req, res) => {
  try {
    const staff = await Staff.findOne({ 
      staffID: req.params.staffID 
    }).select('-password -__v');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    res.status(200).json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error("Staff fetch error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
});

// Remove Student
router.delete("/remove-student/:id", async (req, res) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (error) {
    console.error("Student deletion error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
});

// Remove Staff
router.delete("/remove-staff/:id", async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Staff member deleted successfully"
    });

  } catch (error) {
    console.error("Staff deletion error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get Students by Register Number Range (Admin Only)
router.post("/get-students-by-range", async (req, res) => {
  try {
    const { fromRegister, toRegister } = req.body;

    // Validate input
    if (!fromRegister || !toRegister) {
      return res.status(400).json({
        success: false,
        message: "Both from and to register numbers are required"
      });
    }

    // Get students in range and their current tutor details
    const students = await User.aggregate([
      {
        $match: {
          registerNumber: { $gte: fromRegister, $lte: toRegister }
        }
      },
      {
        $lookup: {
          from: "staff",
          localField: "tutorName",
          foreignField: "name",
          as: "tutorDetails"
        }
      },
      {
        $unwind: {
          path: "$tutorDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          registerNumber: 1,
          semester: 1,
          tutorName: 1,
          currentTutorId: "$tutorDetails._id",
          currentTutorEmail: "$tutorDetails.email"
        }
      }
    ]);

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in the specified range"
      });
    }

    res.status(200).json({
      success: true,
      students: students
    });

  } catch (error) {
    console.error("Error fetching students by range:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      error: error.message
    });
  }
});


// ✅ Change Tutor for Multiple Students (Admin Only)
router.post("/change-tutor", async (req, res) => {
  try {
    const { fromRegister, toRegister, newTutorId } = req.body;

    // Validate input
    if (!fromRegister || !toRegister || !newTutorId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (fromRegister, toRegister, newTutorId)"
      });
    }

    // Get the new tutor details
    const newTutor = await Staff.findById(newTutorId).select("name email");
    if (!newTutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found in staff records"
      });
    }

    // Get students in range for notification
    const studentsToUpdate = await User.find({
      registerNumber: { $gte: fromRegister, $lte: toRegister }
    }).select("name email registerNumber semester");

    if (!studentsToUpdate || studentsToUpdate.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in the specified range"
      });
    }

    // Update all students in the range with the new tutor
    const updateResult = await User.updateMany(
      { registerNumber: { $gte: fromRegister, $lte: toRegister } },
      { 
        $set: { 
          tutorName: newTutor.name,
          tutorId: newTutor._id 
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No students were updated"
      });
    }

    // Send email notification to the new tutor
    const studentList = studentsToUpdate.map(student => 
      `${student.name} (${student.registerNumber}) - Sem ${student.semester}`
    ).join("<br>");

    const mailOptions = {
      from: `"ODCSE Admin" <${process.env.EMAIL_USER}>`,
      to: newTutor.email,
      subject: `You've been assigned as tutor for ${studentsToUpdate.length} students`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
          <!-- Outer Email Container -->
          <div style="max-width: 500px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; 
                      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: left;">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 100px;">
            </div>
            
            <!-- Header Text -->
            <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 10px;">Tutor Assignment Notification</h2>
            
            <!-- Body Text -->
            <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">
              You have been assigned as the tutor for the following students:
            </p>
            
            <!-- Student List Table -->
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">Register Number</th>
                    <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">Name</th>
                  </tr>
                </thead>
                <tbody>
                  ${studentsToUpdate.map((student) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${student.registerNumber}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${student.name}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <!-- Additional Information -->
            <p style="font-size: 16px; color: #333333; margin-bottom: 10px;">
              Total students: <strong>${studentsToUpdate.length}</strong>
            </p>
            <p style="font-size: 14px; color: #666666; margin-bottom: 20px;">
              You will now receive all OD requests from these students for approval.
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center;">
              <p>This is an automated message. Please do not reply directly to this email.</p>
              <p>– ODCSE Support</p>
            </div>
          </div>
        </div>
      `
    };
    
    

    // Send email in background (don't wait for response)
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send tutor notification email:", error);
      } else {
        console.log("Tutor notification email sent:", info.response);
      }
    });

    res.status(200).json({
      success: true,
      message: `Tutor changed successfully for ${updateResult.modifiedCount} students`,
      data: {
        newTutorName: newTutor.name,
        newTutorEmail: newTutor.email,
        studentsUpdated: updateResult.modifiedCount,
        // Add this flag to indicate completion
        tutorChangeComplete: true
      }
    });

  } catch (error) {
    console.error("Error changing tutor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing tutor",
      error: error.message
    });
  }
});

// ✅ Update Student (Admin Only)
// Update the edit staff route
router.put("/update-staff/:id", upload.single('signature'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, staffID, designation, removeSignature } = req.body;

    // Find the staff
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff member not found" 
      });
    }

    // Handle signature removal if requested
    if (removeSignature === 'true' && staff.signature?.public_id) {
      await cloudinary.uploader.destroy(staff.signature.public_id);
      staff.signature = null;
    }

    // Handle new signature upload
    if (req.file) {
      // Delete old signature if exists
      if (staff.signature?.public_id) {
        await cloudinary.uploader.destroy(staff.signature.public_id);
      }

      // Upload new signature
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'staff-signatures',
        transformation: [
          { width: 300, height: 100, crop: "limit" },
          { quality: "auto:good" }
        ]
      });
      
      staff.signature = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Delete the temporary file
      fs.unlinkSync(req.file.path);
    }

    // Update other fields
    staff.name = name || staff.name;
    staff.email = email || staff.email;
    staff.staffID = staffID || staff.staffID;
    staff.designation = designation || staff.designation;

    // Update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      staff.password = await bcrypt.hash(req.body.password, salt);
    }

    await staff.save();

    // Prepare response without sensitive data
    const staffResponse = staff.toObject();
    delete staffResponse.password;
    delete staffResponse.__v;

    res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: staffResponse
    });

  } catch (error) {
    console.error("Staff update error:", error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
});


// ✅ Get Students by Tutor Name (protected route)
router.get("/students-by-tutor", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure you're defining and using User correctly:
    const { tutorName } = req.query;
    if (!tutorName) {
      return res.status(400).json({ message: "Tutor name is required" });
    }

    const decodedTutorName = tutorName.replace(/\+/g, ' ');

    // ✅ Make sure you are importing the User model correctly at the top of your file
    const students = await User.find(
      { tutorName: decodedTutorName },
      'name registerNumber semester'
    ).sort({ registerNumber: 1 });

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No students found for this tutor",
        tutorName: decodedTutorName
      });
    }

    res.status(200).json({
      success: true,
      students: students,
      tutorName: decodedTutorName
    });

  } catch (error) {
    console.error("Error fetching students by tutor:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching students",
      error: error.message
    });
  }
});

router.get("/students/:registerNumber", async (req, res) => {
  try {
    const student = await User.findOne({ 
      registerNumber: req.params.registerNumber 
    }).select('-password -__v');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
    
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching student'
    });
  }
});

// ✅ Search Students
router.get("/search-students", async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 3 characters"
      });
    }

    // Search by name or register number
    const students = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { registerNumber: { $regex: query, $options: 'i' } }
      ]
    }).select('name registerNumber semester tutorName email');

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error("Student search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching students"
    });
  }
});

router.post('/send-invitation', authenticate, async (req, res) => {
  try {
    console.log('Received invitation request body:', req.body);

    // Validate required fields
    const requiredFields = [
      'odRequestId',
      'registerNumber',
      'recipientEmail',
      'eventName',
      'fromDate',
      'toDate',
      'requesterName',
      'requesterEmail'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Verify student exists
    const student = await User.findOne({ registerNumber: req.body.registerNumber });
    if (!student) {
      console.error('Student not found:', req.body.registerNumber);
      return res.status(404).json({
        success: false,
        message: 'Student not found with this register number'
      });
    }

    // Create new invitation
    const invitation = new Invitation({
      odRequestId: req.body.odRequestId,
      registerNumber: req.body.registerNumber,
      recipientEmail: req.body.recipientEmail,
      eventName: req.body.eventName,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      requesterName: req.body.requesterName,
      requesterEmail: req.body.requesterEmail,
      status: 'pending'
    });

    await invitation.save();

    // Get tutor name from the requester's user record
    const requester = await User.findOne({ email: req.body.requesterEmail }).select('tutorName');
    const tutorName = requester?.tutorName || "the tutor";

    // Send email notification
// In your send-invitation route
const mailOptions = {
  from: `"OD System" <${process.env.EMAIL_USER}>`,
  to: req.body.recipientEmail,
  subject: `OD Request Invitation from ${req.body.requesterName}`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
      <!-- Outer Email Container -->
      <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; 
                  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: left;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 100px;">
        </div>
        
        <!-- Header Text -->
        <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 10px; text-align: center;">OD Request Invitation</h2>
        
        <!-- Body Text -->
        <p style="font-size: 15px; color: #333333; margin-bottom: 15px; text-align: center;">
          You've been invited by ${req.body.requesterName} to join an OD request for<br>
          <span style="font-size: 14px;">${req.body.eventName}</span>
        </p>
        
        <!-- Button Container -->
        <div style="margin: 25px 0; text-align: center;">
          <a href="http://localhost:5000/api/auth/respond-invitation?token=${invitation._id}&response=accept" 
            style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; color: white; 
                    text-decoration: none; margin-right: 15px; border-radius: 4px; font-weight: 500;
                    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
            Accept
          </a>
          <a href="http://localhost:5000/api/auth/respond-invitation?token=${invitation._id}&response=decline" 
            style="display: inline-block; padding: 12px 25px; background-color: #f44336; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: 500;
                    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
            Decline
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>– ODCSE Support</p>
        </div>
      </div>
    </div>
  `
};

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitation._id
    });

  } catch (error) {
    console.error('Error in send-invitation:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process invitation',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// In your backend routes (e.g., routes/auth.js)
router.get('/respond-invitation', async (req, res) => {
  try {
    const { token, response } = req.query;
    
    if (!token || !response || !['accept', 'decline'].includes(response)) {
      return res.redirect(`${frontendUrl}/invitation-response?error=invalid_params`);
    }

    const invitation = await Invitation.findById(token);
    if (!invitation) {
      return res.redirect(`${frontendUrl}/invitation-response?error=not_found`);
    }

    if (invitation.status !== 'pending') {
      return res.redirect(`${frontendUrl}/invitation-response?error=already_responded`);
    }

    // Get student details to include in the response
    const student = await User.findOne({ registerNumber: invitation.registerNumber })
      .select('name semester section attendancePercentage')
      .lean();

    invitation.status = response === 'accept' ? 'accepted' : 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    try {
      await sendResponseNotificationEmail({
        ...invitation.toObject(),
        name: student?.name,
        semester: student?.semester,
        section: student?.section,
        attendancePercentage: student?.attendancePercentage
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.redirect(`${frontendUrl}/invitation-response?success=true&response=${response}`);
  } catch (error) {
    console.error('Error in respond-invitation:', error);
    res.redirect(`${frontendUrl}/invitation-response?error=server_error`);
  }
});

// Check invitation statuses with tutor verification
// Check invitation statuses with tutor verification
router.get('/check-invitations', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const invitations = await Invitation.find({
      $or: [
        { requesterEmail: userEmail },
        { recipientEmail: userEmail }
      ],
      status: { $in: ['pending', 'accepted', 'declined'] }
    })
    .sort({ createdAt: -1 })
    .lean();

    // Get student details for each invitation
    const invitationsWithDetails = await Promise.all(invitations.map(async inv => {
      const student = await User.findOne({ registerNumber: inv.registerNumber })
        .select('name semester section attendancePercentage')
        .lean();
      
      return {
        ...inv,
        name: student?.name || inv.name || '',
        semester: student?.semester || inv.semester || '',
        section: student?.section || '',
        attendancePercentage: student?.attendancePercentage || ''
      };
    }));

    res.status(200).json({
      success: true,
      invitations: invitationsWithDetails
    });
  } catch (error) {
    console.error('Error checking invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check invitations'
    });
  }
});

// Cancel invitation route
router.delete('/cancel-invitation/:id', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findByIdAndDelete(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Invitation cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel invitation"
    });
  }
});


router.get('/current-user', async (req, res) => {
  try {
    // Verify authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = req.query.email || decoded.email;

    const user = await User.findOne({ email: userEmail })
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the requested email matches token (if provided)
    if (req.query.email && req.query.email !== decoded.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
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