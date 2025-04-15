const mongoose = require("mongoose");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// YearIncharge Schema
const YearInchargeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    role: { type: String, default: "yearincharge" },
    department: { type: String, required: true, trim: true },
    staffID: { type: String, required: true, unique: true, trim: true },
    designation: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true }  // ✅ Added semester
}, { collection: "yearincharge" });  // ✅ Use correct collection name

// Model
const YearIncharge = mongoose.model("YearIncharge", YearInchargeSchema);

// Function to Add Year Incharge
async function addYearIncharge(data) {
    try {
        const existing = await YearIncharge.findOne({ email: data.email });
        if (existing) {
            console.log("❌ Year Incharge already exists!");
            return;
        }

        const newDoc = new YearIncharge(data);
        await newDoc.save();

        console.log("✅ Year Incharge added successfully!");
    } catch (error) {
        console.error("❌ Error adding Year Incharge:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Example Data
const yearIncharge = {
    name: "Mr. Suresh Kumar",
    email: "sureshkumar@gmail.com",
    department: "Computer Science",
    staffID: "22CS301",
    designation: "Year Incharge",
    semester: "6"
};

// Call Function
addYearIncharge(yearIncharge);
