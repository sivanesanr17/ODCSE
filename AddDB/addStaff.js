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
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "staff" },
    department: { type: String, required: true, trim: true },
    staffID: { type: String, required: true, unique: true, trim: true },
    designation: { type: String, required: true, trim: true }   // ✅ Added designation field
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

// Staff Model
const Staff = mongoose.model("Staff", StaffSchema);

// Function to Add Staff
async function addStaff(staffData) {
    try {
        // Check if the staff already exists
        const existingStaff = await Staff.findOne({ email: staffData.email });
        if (existingStaff) {
            console.log("❌ Staff already exists!");
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

// Example Staff Data with Designation
const staff = {
    name: "Mrs. Dharshana Deepthi",
    email: "dharashanadeepthi@gmail.com",
    password: "Cnpsharan@17",
    department: "Computer Science",
    staffID: "22CS201",
    designation: "Assistant Professor"   // ✅ Added designation field
};

// Call Function
addStaff(staff);
