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

// Method to compare passwords (defensive)
// - Returns false if input password is falsy
// - If a hashed `password` exists, use bcrypt.compare
// - If a legacy plaintext `pass` field exists in the document (from older inserts),
//   compare directly and migrate it to a hashed `password` field in the DB.
ShotUserSchema.methods.comparePassword = async function (password) {
    if (!password) return false;

    // If we have a proper hashed password, use bcrypt.compare
    if (this.password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (err) {
            console.error("bcrypt compare error:", err);
            return false;
        }
    }

    // Legacy support: some documents may have a plaintext `pass` field (not ideal).
    // If present and matches the provided password, migrate it: hash and store
    // in the `password` field and remove the plaintext `pass` field from the DB.
    if (this.pass) {
        try {
            if (password === this.pass) {
                const hashed = await bcrypt.hash(this.pass, 10);
                // Update raw DB to set `password` and unset `pass` to avoid schema issues
                await this.constructor.updateOne({ _id: this._id }, { $set: { password: hashed }, $unset: { pass: "" } });
                return true;
            }
        } catch (err) {
            console.error("Error migrating legacy pass field:", err);
            return false;
        }
    }

    // No usable password/hash found
    return false;
};

module.exports = mongoose.model("ShotUser", ShotUserSchema);
