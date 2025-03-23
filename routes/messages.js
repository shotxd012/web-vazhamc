const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

router.post("/send-message", async (req, res) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not logged in" });

    try {
        const userData = await User.findOne({ discordId: req.user.discordId });

        const newMessage = new Message({
            userId: req.user.discordId,
            username: req.user.username,
            role: userData ? userData.role : "Member",
            avatar: req.user.avatar,
            message: req.body.message
        });

        await newMessage.save();

        // Keep only the last 4 messages in the database
        const totalMessages = await Message.countDocuments();
        if (totalMessages > 4) {
            const oldestMessage = await Message.findOne().sort({ timestamp: 1 });
            if (oldestMessage) {
                await Message.deleteOne({ _id: oldestMessage._id });
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Error saving message:", err);
        res.status(500).json({ success: false });
    }
});

router.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(20);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Error fetching messages" });
    }
});

module.exports = router;
