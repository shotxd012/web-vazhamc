const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ShotUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Hashed passwords
});

// Method to hash password before saving
ShotUserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare passwords
ShotUserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("ShotUser", ShotUserSchema);
