const express = require("express");
const router = express.Router();
const Media = require("../../../models/Media");

router.get("/", async (req, res) => {
    try {
        const media = await Media.find();
        res.json(media);
    } catch (err) {
        console.error("❌ Failed to fetch media:", err);
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

module.exports = router; 