const express = require("express");
const router = express.Router();
const Comment = require("../../../models/Comment");

router.get("/", async (req, res) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch (err) {
        console.error("❌ Failed to fetch comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

module.exports = router; 