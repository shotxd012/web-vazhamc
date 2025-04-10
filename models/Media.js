const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    imageUrl: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Media", MediaSchema);
