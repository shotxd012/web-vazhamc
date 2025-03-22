const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");

// Middleware to ensure user is logged in
function authshot(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: "Unauthorized" });
}

// Log an action
router.post("/shot/action", authshot, async (req, res) => {
    const { action } = req.body;

    if (!action) {
        return res.status(400).json({ error: "Action is required" });
    }

    try {
        await ActivityLog.create({ username: req.session.user.username, action });
        res.json({ success: true });
    } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch recent activities
router.get("/shot/activity", authshot, async (req, res) => {
    try {
        const activities = await ActivityLog.find().sort({ timestamp: -1 }).limit(10);
        res.json(activities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
