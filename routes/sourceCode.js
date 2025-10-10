const express = require("express");
const router = express.Router();
const SourceCode = require("../models/SourceCode");
const { isAuthenticated } = require("../middleware/ensureAuthenticated");
const SourceCodeOrder = require("../models/SourceCodeOrder");
const Ticket = require("../models/Ticket");

// GET /source-code
router.get("/source-code", isAuthenticated, async (req, res) => {
    try {
        const guildId = process.env.GUILD_ID;
        if (req.user.guilds.some(g => g.id === guildId)) {
            const sourceCodes = await SourceCode.find().sort({ timestamp: -1 });
            res.render("source-code", { user: req.user, sourceCodes });
        } else {
            res.status(403).send("You are not in the correct server to view this page.");
        }
    } catch (err) {
        console.error("Error loading source codes:", err);
        res.status(500).send("Server Error");
    }
});

// GET /source-code/:id/purchase
router.get("/source-code/:id/purchase", isAuthenticated, async (req, res) => {
    try {
        const sourceCode = await SourceCode.findById(req.params.id);
        if (!sourceCode || !sourceCode.isPaid) {
            return res.status(404).send("Source code not found or not for sale.");
        }
        res.render("purchase-source-code", { user: req.user, sourceCode });
    } catch (err) {
        console.error("Error loading purchase page:", err);
        res.status(500).send("Server Error");
    }
});

// POST /source-code/:id/purchase
router.post("/source-code/:id/purchase", isAuthenticated, async (req, res) => {
    try {
        const sourceCode = await SourceCode.findById(req.params.id);
        if (!sourceCode || !sourceCode.isPaid) {
            return res.status(404).send("Source code not found or not for sale.");
        }

        const order = new SourceCodeOrder({
            userId: req.user.discordId,
            username: req.user.username,
            avatar: req.user.avatar,
            sourceCodeId: sourceCode._id,
            price: sourceCode.price
        });
        await order.save();

        const ticket = new Ticket({
            userId: req.user.discordId,
            username: req.user.username,
            avatar: req.user.avatar,
            title: `Source Code Purchase: ${sourceCode.title}`,
            reason: "Source Code Purchase",
            description: `Order ID: ${order.orderId}`,
            type: "high"
        });
        await ticket.save();

        res.redirect("/profile/tickets");
    } catch (err) {
        console.error("Error purchasing source code:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;