const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: String,
    username: String,
    role: { type: String, default: "Member" },
    avatar: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
