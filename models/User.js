const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    guilds: Array,
    role: { type: String, default: "Member" }
});

module.exports = mongoose.model("User", UserSchema);
