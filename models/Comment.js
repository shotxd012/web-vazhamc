const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    mediaId: String,
    userId: String,
    username: String,
    avatar: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);
