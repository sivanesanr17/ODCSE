const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    registerNumber: { type: String, required: true, unique: true },
    semester: { type: Number, required: true },
    tutorName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("users", UserSchema);

// Function to Add User
async function addUser(userData) {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            console.log("❌ User already exists!");
            mongoose.connection.close();
            return;
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create User
        const newUser = new User({ ...userData, password: hashedPassword });
        await newUser.save();

        console.log("✅ User added successfully!");
    } catch (error) {
        console.error("❌ Error adding user:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Example User Data
const user = {
    name: "Tuhin",
    registerNumber: "92132213204",
    semester: 6,
    tutorName: "Dr. Suresh AP/CSE",
    email: "tuhin@gmail.com",
    password: "12345",  // Plaintext password, will be hashed
};

// Call Function
addUser(user);
