const express = require("express");
const router = express.Router();
const Ticket = require("../../../models/Ticket");

router.get("/", async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.json(tickets);
    } catch (err) {
        console.error("❌ Failed to fetch tickets:", err);
        res.status(500).json({ error: "Failed to fetch tickets" });
    }
});

module.exports = router; 