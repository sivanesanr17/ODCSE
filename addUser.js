const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect("mongodb://127.0.0.1:27017/odcse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model("users", UserSchema);

async function addUser() {
    const hashedPassword = await bcrypt.hash("alter17@", 10);
    const newUser = new User({ email: "alternativeusemail17@gmail.com", password: hashedPassword });

    await newUser.save();
    console.log("✅ User added successfully!");
    mongoose.connection.close();
}

addUser();
