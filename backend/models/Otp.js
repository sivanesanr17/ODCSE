const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }, // Expiry time added
});

module.exports = mongoose.model("Otp", otpSchema);
