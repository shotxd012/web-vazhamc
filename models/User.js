const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    role: { type: String, default: "Member" }
});

module.exports = mongoose.model("User", UserSchema);
