// routes/shot/tickets.js
const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");

router.get("/shot/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.render("ADtickets", { tickets });
});

router.get("/shot/ticket/:ticketId", async (req, res) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });
  
    if (!ticket) return res.status(404).send("Ticket not found");
  
    res.render("ADticketDetail", { ticket, messages });
  });

module.exports = router;
