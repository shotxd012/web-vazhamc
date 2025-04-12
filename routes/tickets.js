const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");

// Auth middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.redirect("/login");
}

// Ticket panel
router.get("/profile/tickets", isAuthenticated, async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user.discordId }).sort({ createdAt: -1 });
    res.render("ticketPanel", { user: req.user, tickets });
});

// Create ticket
router.post("/profile/tickets/create", isAuthenticated, async (req, res) => {
    const { title, reason, description, type } = req.body;

    if (!title || !reason || !type) {
        return res.redirect("/profile/tickets");
    }

    await new Ticket({
        userId: req.user.discordId,
        username: req.user.username,
        avatar: req.user.avatar,
        title,
        reason,
        description,
        type
    }).save();

    res.redirect("/profile/tickets");
});

module.exports = router;
