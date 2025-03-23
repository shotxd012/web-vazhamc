const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Fetch real-time MongoDB stats
router.get("/shot/mongo-stats", async (req, res) => {
    try {
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ error: "MongoDB is not connected" });
        }

        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ error: "MongoDB connection not established" });
        }

        const stats = await db.stats(); // General database stats
        const serverStatus = await db.admin().serverStatus(); // Server status
        let connections = await db.admin().command({ connectionStatus: 1 }).catch(() => null); // Connection status

        res.json({
            dbStats: stats,
            serverStatus,
            connections: connections ? connections.connections : { current: "N/A" }
        });
    } catch (error) {
        console.error("Error fetching MongoDB stats:", error);
        res.status(500).json({ error: "Failed to fetch MongoDB stats" });
    }
});

module.exports = router;
