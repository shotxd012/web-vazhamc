const express = require("express");
const router = express.Router();
const axios = require("axios");
const cloudinary = require("../../../config/cloudinary");

// Minecraft server status
router.get("/vazha", async (req, res) => {
    try {
        const response = await axios.get("https://api.mcsrvstat.us/3/play.vazha.fun:25572");
        res.json(response.data);
    } catch (err) {
        console.error("❌ Failed to fetch Minecraft server status:", err);
        res.status(500).json({ error: "Failed to fetch Minecraft server status" });
    }
});

// Media service status
router.get("/media", async (req, res) => {
    try {
        const result = await cloudinary.api.ping();
        
        if (result.status === 'ok') {
            return res.status(200).json({
                status: 'connected',
                message: 'Media service (Cloudinary) is connected successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                status: 'disconnected',
                message: 'Media service (Cloudinary) is not responding correctly',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'disconnected',
            message: 'Failed to connect to media service (Cloudinary)',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 