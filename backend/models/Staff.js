const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// models/Staff.js
const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff" },
  department: { type: String, required: true, trim: true },  
  staffID: { type: String, required: true, unique: true, trim: true },
  designation: { type: String, required: true, trim: true },
  signature: { 
    public_id: String,
    url: String 
  }
}, { collection: "staffs" });

// ✅ Automatically Hash Password Before Saving
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Compare Password for Login
StaffSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Staff", StaffSchema);
