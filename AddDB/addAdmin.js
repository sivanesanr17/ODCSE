const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Admin Schema
const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
AdminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Admin = mongoose.model("admins", AdminSchema);

// Function to Add Admin
async function addAdmin(adminData) {
    try {
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log("❌ Admin already exists!");
            mongoose.connection.close();
            return;
        }

        const newAdmin = new Admin(adminData);
        await newAdmin.save();
        console.log("✅ Admin added successfully!");
    } catch (error) {
        console.error("❌ Error adding admin:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Example Admin Data
const admin = {
    name: "Admin User",
    email: "admin@gmail.com",
    password: "Admin@17"
};

// Call Function
addAdmin(admin);
