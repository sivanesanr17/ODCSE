const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const User = require("../models/User");
const OTP = require("../models/Otp");
const Staff = require("../models/Staff");
const Invitation = require('../models/Invitation'); // Adjust path as needed
const OdRequest = require("../models/OdRequest");
const Admin = require("../models/Admin");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const cloudinary = require('cloudinary').v2;

dotenv.config();
const router = express.Router();

// Generate a unique request ID
const generateRequestId = () => {
  const prefix = "OD";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
};


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

// 🔹 Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authorization token required" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
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

router.get('/respond-invitation', async (req, res) => {
  try {
    const { token, response } = req.query;
    
    if (!token || !response || !['accept', 'decline'].includes(response)) {
      return res.redirect(`${process.env.FRONTEND_URL}/invitation-response?error=invalid_params`);
    }

    const invitation = await Invitation.findById(token);
    if (!invitation) {
      return res.redirect(`${process.env.FRONTEND_URL}/invitation-response?error=not_found`);
    }

    if (invitation.status !== 'pending') {
      return res.redirect(`${process.env.FRONTEND_URL}/invitation-response?error=already_responded`);
    }

    // Get student details to include in the response
    const student = await User.findOne({ registerNumber: invitation.registerNumber })
      .select('name semester section attendancePercentage')
      .lean();

    if (response === 'accept') {
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();
      
      // Redirect with success and accepted response
      return res.redirect(`${process.env.FRONTEND_URL}/invitation-response?success=true&response=accepted`);
    } else {
      // If declined, delete the invitation
      await Invitation.findByIdAndDelete(token);
      return res.redirect(`${process.env.FRONTEND_URL}/invitation-response?success=true&response=declined`);
    }

  } catch (error) {
    console.error('Error in respond-invitation:', error);
    res.redirect(`${process.env.FRONTEND_URL}/invitation-response?error=server_error`);
  }
});

// Check invitation statuses with tutor verification
router.get('/check-invitations', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const invitations = await Invitation.find({
      $or: [
        { requesterEmail: userEmail },
        { recipientEmail: userEmail }
      ],
      status: { $in: ['pending', 'accepted'] } // Only include pending or accepted
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


// ✅ Create Event with File Upload
router.post('/add-events', upload.single('file'), async (req, res) => {
  let tempFilePath = req.file?.path;
  
  try {
    const { name, description, venue, registrationStart, registrationEnd } = req.body;
    
    if (!name || !description || !venue || !registrationStart || !registrationEnd || !req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields including file upload are required' 
      });
    }

    // Validate description length
    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'event-posters',
      resource_type: 'auto'
    });

    // Validate dates
    const startDate = new Date(registrationStart);
    const endDate = new Date(registrationEnd);
    if (endDate <= startDate) {
      // Clean up Cloudinary upload if date validation fails
      await cloudinary.uploader.destroy(result.public_id);
      return res.status(400).json({
        success: false,
        message: 'Registration end date must be after start date'
      });
    }

    // Create event
    const newEvent = new Event({
      name,
      description: description.substring(0, 1000), // Ensure length
      venue,
      registrationStart,
      registrationEnd,
      fileName: req.file.originalname,
      filePath: result.secure_url,
      fileType: req.file.mimetype,
      cloudinaryPublicId: result.public_id
    });

    const savedEvent = await newEvent.save();

    // Delete temp file only after everything succeeds
    if (tempFilePath) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Temp file deletion error:', err);
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Event uploaded successfully',
      event: savedEvent
    });

  } catch (error) {
    console.error('Error in event creation:', error);
    
    // Clean up in reverse order (Cloudinary first, then local file)
    if (error.result?.public_id) {
      try {
        await cloudinary.uploader.destroy(error.result.public_id);
      } catch (cloudinaryErr) {
        console.error('Cloudinary cleanup error:', cloudinaryErr);
      }
    }

    if (tempFilePath) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Temp file cleanup error:', err);
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

    // 2️⃣ Find tutor in STAFF collection - using name instead of ID
    const tutor = await Staff.findOne({ name: tutorName }).select("name");
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found in staff records" });
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4️⃣ Save student with tutor's NAME
    const newStudent = new User({
      name,
      registerNumber,
      semester: parseInt(semester),
      tutorName: tutor.name,
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

// In your backend routes file
// Get all users (Admin only)
router.get("/admin/users", authenticate, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized: Admin access required" 
      });
    }

    const users = await User.find({})
      .select('-password -__v')
      .sort({ registerNumber: 1 });

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching users",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Add Staff (Admin Only)
// authRoutes.js
// Update the route to handle file uploads
router.post("/add-staff", upload.single('signature'), async (req, res) => {
  try {
    // Get text fields from req.body and file from req.file
    const { name, email, password, staffID, designation } = req.body;
    const department = "Computer Science and Engineering";
    
    // Validate input (make signature optional)
    if (!name || !email || !password || !staffID || !designation) {
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

    // Handle signature file if uploaded
    let signatureData = null;
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'staff-signatures'
      });
      
      // Delete the temporary file
      fs.unlinkSync(req.file.path);
      
      signatureData = {
        public_id: result.public_id,
        url: result.secure_url
      };
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
          <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; 
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
            
            <!-- Student List Container -->
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; font-size: 15px; color: #000000;">
              ${studentList}
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
router.put("/update-student/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registerNumber, semester, email } = req.body;

    // 1️⃣ Find the student
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    // 2️⃣ Check for duplicate registerNumber or email
    if (registerNumber && registerNumber !== student.registerNumber) {
      const regNumberExists = await User.findOne({ registerNumber });
      if (regNumberExists) {
        return res.status(400).json({ 
          success: false,
          message: "Register number already in use by another student" 
        });
      }
    }

    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          message: "Email already in use by another student" 
        });
      }
    }

    // 3️⃣ Update fields
    student.name = name || student.name;
    student.registerNumber = registerNumber || student.registerNumber;
    student.semester = semester || student.semester;
    student.email = email || student.email;

    // 4️⃣ Explicitly prevent password updates
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be updated through this endpoint"
      });
    }

    // 5️⃣ Save updated student
    await student.save();

    // 6️⃣ Prepare response without sensitive data
    const studentResponse = student.toObject();
    delete studentResponse.password;
    delete studentResponse.__v;

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: studentResponse
    });

  } catch (error) {
    console.error("Student update error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
});

// ✅ Update Staff (Admin Only)
// Update the backend route in your authRoutes.js
router.put("/update-staff/:id", upload.single('signature'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, staffID, designation, removeSignature } = req.body;
    
    // Find the staff member
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff member not found" 
      });
    }

    // Update fields
    staff.name = name || staff.name;
    staff.email = email || staff.email;
    staff.staffID = staffID || staff.staffID;
    staff.designation = designation || staff.designation;

    // Handle password update if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      staff.password = await bcrypt.hash(req.body.password, salt);
    }

    // Handle signature updates
    if (req.file) {
      // If there's an existing signature, delete it from Cloudinary first
      if (staff.signature?.public_id) {
        await cloudinary.uploader.destroy(staff.signature.public_id);
      }
      
      // Upload new signature to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'staff-signatures'
      });
      
      // Delete the temporary file
      fs.unlinkSync(req.file.path);
      
      staff.signature = {
        public_id: result.public_id,
        url: result.secure_url
      };
    } else if (removeSignature === 'true') {
      // Remove existing signature if requested
      if (staff.signature?.public_id) {
        await cloudinary.uploader.destroy(staff.signature.public_id);
        staff.signature = null;
      }
    }

    // Save updated staff
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

// ✅ Submit OD Request
router.post("/od/submit", authenticate, upload.array('documents', 3), async (req, res) => {
  try {
    const {
      eventName,
      fromDate,
      toDate,
      numberOfDays,
      venue,
      students // This comes as a JSON string
    } = req.body;

    // Parse the students string into an array
    const studentsArray = typeof students === 'string' ? JSON.parse(students) : students;

    // Validate required fields
    if (!eventName || !fromDate || !toDate || !numberOfDays || !venue || !studentsArray || studentsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Get current user (requester)
    const requester = await User.findOne({ email: req.user.email });
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: "Requester not found"
      });
    }

    // Get tutor details
    const tutor = await Staff.findOne({ name: requester.tutorName });
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found"
      });
    }

    // Process uploaded documents
    const documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'od-documents',
          resource_type: 'auto'
        });
        documents.push({
          name: file.originalname,
          url: result.secure_url,
          type: file.mimetype
        });
        // Delete temp file
        fs.unlinkSync(file.path);
      }
    }

    // Create participants array
    const participants = studentsArray.map(student => ({
      registerNumber: student.registerNumber,
      name: student.name,
      semester: student.semester,
      section: student.section || '',
      attendancePercentage: student.attendancePercentage || 0,
      status: student.isRequester ? "accepted" : student.status || "pending",
      invitationId: student.invitationId || null
    }));

    // Create new OD request
    const newRequest = new OdRequest({
      requestId: generateRequestId(),
      eventName,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfDays,
      venue,
      status: "pending",
      requester: {
        registerNumber: requester.registerNumber,
        name: requester.name,
        email: requester.email,
        semester: requester.semester,
        section: requester.section,
        attendancePercentage: requester.attendancePercentage
      },
      tutor: {
        name: tutor.name,
        email: tutor.email,
        staffId: tutor.staffID
      },
      participants,
      supportingDocuments: documents
    });

    // Save the request
    const savedRequest = await newRequest.save();

    // Send email notification to tutor
    const mailOptions = {
      from: `"OD System" <${process.env.EMAIL_USER}>`,
      to: tutor.email,
      subject: `New OD Request from ${requester.name}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
          <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: left;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 100px;">
            </div>
            <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 20px; text-align: center;">New OD Request</h2>
            <p style="font-size: 15px; color: #333333; margin-bottom: 15px;">
              You have received a new OD request from <strong>${requester.name}</strong> (${requester.registerNumber}) for the event:
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; color: #000000;">
              <p style="margin-top: 0; font-weight: 600;">Event Details:</p>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;">Event: ${eventName}</li>
                <li style="margin-bottom: 5px;">Dates: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}</li>
                <li style="margin-bottom: 5px;">Venue: ${venue}</li>
                <li>Number of Days: ${numberOfDays}</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
                View Request
              </a>
            </div>
            <div style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center;">
              <p>This is an automated message. Please do not reply directly to this email.</p>
              <p>– ODCSE Support</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Update invitation statuses for participants
    await Invitation.updateMany(
      { 
        _id: { $in: participants.filter(p => p.invitationId).map(p => p.invitationId) }
      },
      { $set: { status: "submitted" } }
    );

    res.status(201).json({
      success: true,
      message: "OD request submitted successfully",
      request: savedRequest
    });

  } catch (error) {
    console.error("Error submitting OD request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit OD request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// ✅ Get OD Requests for Student
// ✅ Get OD Requests for Student
router.get("/od/student-requests", authenticate, async (req, res) => {
  try {
    const requests = await OdRequest.find({ "requester.email": req.user.email })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Error fetching student OD requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch OD requests"
    });
  }
});

// ✅ Get OD Requests for Tutor
router.get("/od/tutor-requests", authenticate, async (req, res) => {
  try {
    // First check if the user is a staff member
    const staff = await Staff.findOne({ email: req.user.email });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Tutor privileges required."
      });
    }

    const requests = await OdRequest.find({ "tutor.email": req.user.email })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Error fetching tutor OD requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch OD requests"
    });
  }
});

// ✅ Get Single OD Request
router.get("/od/request/:id", authenticate, async (req, res) => {
  try {
    const request = await OdRequest.findOne({ 
      $or: [
        { _id: req.params.id },
        { requestId: req.params.id }
      ]
    }).lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "OD request not found"
      });
    }

    // Check if user is authorized to view this request
    const isRequester = request.requester.email === req.user.email;
    const isTutor = request.tutor.email === req.user.email;
    const isAdmin = req.user.role === "admin";
    
    if (!isRequester && !isTutor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this request"
      });
    }

    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    console.error("Error fetching OD request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch OD request"
    });
  }
});

// ✅ Update OD Request Status (Approve/Reject)
router.put("/od/request/:id/status", authenticate, upload.single('signature'), async (req, res) => {
  try {
    const { status, comments } = req.body;
    const requestId = req.params.id;

    if (req.query.processing === 'true') {
      return res.status(202).json({
        success: true,
        isProcessing: true,
        message: "Processing request..."
      });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Check if user is a tutor
    const tutor = await Staff.findOne({ email: req.user.email });
    if (!tutor) {
      return res.status(403).json({
        success: false,
        message: "Only tutors can approve/reject requests"
      });
    }

    // Find the request
    const request = await OdRequest.findOne({
      $or: [
        { _id: requestId },
        { requestId: requestId }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "OD request not found"
      });
    }

    // Verify the tutor is the assigned tutor
    if (request.tutor.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned tutor for this request"
      });
    }

    // Handle signature upload if provided
    let signatureUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'od-signatures'
      });
      signatureUrl = result.secure_url;
      // Delete temp file
      fs.unlinkSync(req.file.path);
    }

    // Update request status
    request.status = status;
    request.decision = {
      by: tutor.name,
      at: new Date(),
      comments: comments || "",
      signatureUrl: signatureUrl || request.decision?.signatureUrl
    };
    request.updatedAt = new Date();

    const updatedRequest = await request.save();

    // Send email notification to requester
    const mailOptions = {
      from: `"OD System" <${process.env.EMAIL_USER}>`,
      to: request.requester.email,
      subject: `Your OD Request has been ${status}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 40px; text-align: center;">
          <div style="max-width: 450px; background-color: #ffffff; margin: auto; padding: 30px; border-radius: 6px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: left;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/ic2FQIc.png" alt="ODCSE Logo" style="max-width: 100px;">
            </div>
            <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 20px; text-align: center;">
              OD Request ${status === "approved" ? "Approved" : "Rejected"}
            </h2>
            <p style="font-size: 15px; color: #333333; margin-bottom: 15px;">
              Your OD request for <strong>${request.eventName}</strong> has been <strong style="color: ${status === "approved" ? "#4CAF50" : "#f44336"}">${status}</strong> by ${tutor.name}.
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; color: #000000;">
              <p style="margin-top: 0; font-weight: 600;">Request Details:</p>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;">Event: ${request.eventName}</li>
                <li style="margin-bottom: 5px;">Dates: ${new Date(request.fromDate).toLocaleDateString()} - ${new Date(request.toDate).toLocaleDateString()}</li>
                <li style="margin-bottom: 5px;">Status: <span style="color: ${status === "approved" ? "#4CAF50" : "#f44336"}">${status}</span></li>
                ${comments ? `<li style="margin-bottom: 5px;">Comments: ${comments}</li>` : ""}
              </ul>
            </div>
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
      isProcessing: false,  // Explicitly set to false when done
      message: `OD request ${status} successfully`,
      request: updatedRequest
    });

  } catch (error) {
    console.error("Error updating OD request status:", error);
    res.status(500).json({
      success: false,
      isProcessing: false,
      message: "Failed to update OD request status"
    });
  }
});

// In your backend routes
router.get('/get-staff-signature', authenticate, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Staff name is required' });
    }

    const staff = await Staff.findOne({ name: new RegExp(name, 'i') });
    if (!staff || !staff.signature?.url) {
      return res.status(404).json({ success: false, message: 'Staff signature not found' });
    }

    res.json({ 
      success: true, 
      signatureUrl: staff.signature.url 
    });
  } catch (error) {
    console.error('Error fetching staff signature:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;