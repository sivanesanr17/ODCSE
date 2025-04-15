// models/OdRequest.js
const mongoose = require("mongoose");

const odRequestSchema = new mongoose.Schema({
  // Basic request information
  requestId: { type: String, required: true, unique: true },
  eventName: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  venue: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Student information
  requester: {
    registerNumber: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    semester: { type: String, required: true },
    section: { type: String },
    attendancePercentage: { type: Number }
  },

  // Tutor information
  tutor: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    staffId: { type: String }
  },

  // Participating students (including requester)
  participants: [{
    registerNumber: { type: String, required: true },
    name: { type: String, required: true },
    semester: { type: String, required: true },
    section: { type: String },
    attendancePercentage: { type: Number },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" }
  }],

  // Approval/rejection details
  decision: {
    by: { type: String }, // Tutor name or admin name
    at: { type: Date },
    comments: { type: String },
    signatureUrl: { type: String } // URL to digital signature
  },

  // Additional documents
  supportingDocuments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model("OdRequest", odRequestSchema);