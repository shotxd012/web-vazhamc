const mongoose = require("mongoose");

const SourceCodeSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    title: String,
    description: String,
    githubLink: String,
    youtubeThumbnail: String,
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SourceCode", SourceCodeSchema);