const mongoose = require("mongoose");

const TicketMessageSchema = new mongoose.Schema({
  ticketId: String,
  userId: String,
  username: String,
  avatar: String,
  message: String,
  image: String,
  role: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TicketMessage", TicketMessageSchema);
