const mongoose = require("mongoose");
const shortid = require("shortid");

const TicketSchema = new mongoose.Schema({
    userId: String,
    username: String,
    avatar: String,
    title: String,
    reason: String,
    description: String,
    type: { type: String, enum: ["low", "medium", "high", "suggestion"], default: "low" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    ticketId: { type: String, default: () => `TKT-${shortid.generate().toUpperCase()}` },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", TicketSchema);
