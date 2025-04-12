const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
    userId: String,
    username: String,
    avatar: String,
    title: String,
    reason: String,
    description: String,
    type: { type: String, enum: ["low", "medium", "high", "suggestion"], default: "low" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", TicketSchema);
