const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const User = require("../models/User");
const axios = require("axios");

// 🛡️ Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.status(401).json({ error: "Unauthorized" });
}

// 📊 GET /api/profile/stats - Returns user statistics
router.get("/api/v1/profile/stats", isAuthenticated, async (req, res) => {
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

// 🏆 GET /api/top-users - Public API showing top 10 users by media + likes + comments + username
router.get("/api/v1/top-users", async (req, res) => {
    try {
        const mediaData = await Media.aggregate([
            {
                $group: {
                    _id: "$discordId",
                    mediaCount: { $sum: 1 },
                    totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
                }
            }
        ]);

        const commentData = await Comment.aggregate([
            {
                $group: {
                    _id: "$userId",
                    commentCount: { $sum: 1 }
                }
            }
        ]);

        const userMap = new Map();

        mediaData.forEach(doc => {
            userMap.set(doc._id, {
                discordId: doc._id,
                mediaCount: doc.mediaCount,
                totalLikes: doc.totalLikes,
                commentCount: 0,
            });
        });

        commentData.forEach(doc => {
            if (userMap.has(doc._id)) {
                userMap.get(doc._id).commentCount = doc.commentCount;
            } else {
                userMap.set(doc._id, {
                    discordId: doc._id,
                    mediaCount: 0,
                    totalLikes: 0,
                    commentCount: doc.commentCount,
                });
            }
        });

        let topUsers = Array.from(userMap.values())
            .sort((a, b) => (b.mediaCount + b.totalLikes + b.commentCount) - (a.mediaCount + a.totalLikes + a.commentCount))
            .slice(0, 10);

        const userIds = topUsers.map(u => u.discordId);
        const userDocs = await User.find({ discordId: { $in: userIds } });

        // Map discordId => username
        const userInfoMap = new Map();
        userDocs.forEach(user => {
            userInfoMap.set(user.discordId, {
                username: user.username,
                avatar: user.avatar, // optional
            });
        });

        // Attach username (and avatar optionally)
        topUsers = topUsers.map(u => ({
            ...u,
            username: userInfoMap.get(u.discordId)?.username || "Unknown",
            avatar: userInfoMap.get(u.discordId)?.avatar || null,
        }));

        res.json(topUsers);
    } catch (err) {
        console.error("❌ Failed to fetch top users:", err);
        res.status(500).json({ error: "Failed to fetch top users" });
    }
});

router.get("/api/v1/media", async (req, res) => {
    try {
        const media = await Media.find();
        res.json(media);
    } catch (err) {
        console.error("❌ Failed to fetch media:", err);
        res.status(500).json({ error: "Failed to fetch media" });
    }
}); 

// ticket api
router.get("/api/v1/tickets", async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.json(tickets);
    } catch (err) {
        console.error("❌ Failed to fetch tickets:", err);
        res.status(500).json({ error: "Failed to fetch tickets" });
    }
}); 

// comment api
router.get("/api/v1/comments", async (req, res) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch (err) {
        console.error("❌ Failed to fetch comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
}); 

// make a mcserver status api use https://api.mcsrvstat.us/3/play.vazha.fun:25572
router.get("/api/v1/vazha-status", async (req, res) => {
    try {
        const response = await axios.get("https://api.mcsrvstat.us/3/play.vazha.fun:25572");
        res.json(response.data);
    } catch (err) {
        console.error("❌ Failed to fetch Minecraft server status:", err);
        res.status(500).json({ error: "Failed to fetch Minecraft server status" });
    }
}); 


module.exports = router;
