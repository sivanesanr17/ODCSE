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
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Admin = mongoose.model("admins", AdminSchema);

// Function to Add Admin
async function addAdmin(adminData) {
    try {
        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log("❌ Admin already exists!");
            mongoose.connection.close();
            return;
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create Admin
        const newAdmin = new Admin({ ...adminData, password: hashedPassword });
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
    email: "admin@gmail.com",
    password: "Admin@17",  // Plaintext password, will be hashed
};

// Call Function
addAdmin(admin);
