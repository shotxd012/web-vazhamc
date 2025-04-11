const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    imageUrl: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    voters: [String],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Media", MediaSchema);
