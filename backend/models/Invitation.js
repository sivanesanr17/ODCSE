// models/Invitation.js
const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  odRequestId: String,
  registerNumber: String,
  recipientEmail: String,
  eventName: String,
  fromDate: Date,
  toDate: Date,
  requesterName: String,
  requesterEmail: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  respondedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add TTL index that will delete documents 1 hour after createdAt
InvitationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('Invitation', InvitationSchema);