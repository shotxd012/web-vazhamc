const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
    username: String,
    action: String,
    status: { type: String, default: "Success" },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
