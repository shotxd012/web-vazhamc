const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    username: String,
    discordId: String,
    avatar: String,
    imageUrl: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [String],   
    dislikedBy: [String],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Media", mediaSchema);
