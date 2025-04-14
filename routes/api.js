const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");

// 🛡️ Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.status(401).json({ error: "Unauthorized" });
}

// 📊 GET /api/profile/stats - Returns user statistics
router.get("/api/profile/stats", isAuthenticated, async (req, res) => {
    const userId = req.user.discordId;

    try {
        const [mediaCount, activeTickets, commentCount, mediaDocs] = await Promise.all([
            Media.countDocuments({ discordId: userId }),
            Ticket.countDocuments({ userId, status: "open" }),
            Comment.countDocuments({ userId }),
            Media.find({ discordId: userId }),
        ]);

        const totalLikes = mediaDocs.reduce((sum, media) => sum + (media.likes || 0), 0);

        res.json({
            mediaCount,
            activeTickets,
            totalLikes,
            commentCount,
        });
    } catch (err) {
        console.error("❌ Failed to fetch user stats:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

module.exports = router;
