const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Staff Schema
const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    staffID: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Staff = mongoose.model("staffs", StaffSchema);

// Function to Add Staff
async function addStaff(staffData) {
    try {
        // Check if the staff already exists
        const existingStaff = await Staff.findOne({ email: staffData.email });
        if (existingStaff) {
            console.log("❌ Staff already exists!");
            mongoose.connection.close();
            return;
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(staffData.password, 10);

        // Create Staff
        const newStaff = new Staff({ ...staffData, password: hashedPassword });
        await newStaff.save();

        console.log("✅ Staff added successfully!");
    } catch (error) {
        console.error("❌ Error adding staff:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Example Staff Data
const staff = {
    name: "Sivanesan",
    staffID: "22CS201",
    department: "Computer Science",
    designation: "Associate Professor",
    email: "cnpnesan@gmail.com",
    password: "securepassword",  // Plaintext password, will be hashed
};

// Call Function
addStaff(staff);
