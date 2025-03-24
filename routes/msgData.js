const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Announcement = require("../models/Announcement");

// Fetch all messages
router.get("/shot/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 });
        res.render("shotMessages", { messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Add a new message
router.post("/shot/messages/add", async (req, res) => {
    const { userId, username, role, avatar, message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "Message is required" });

    try {
        const newMessage = new Message({ userId, username, role, avatar, message });
        await newMessage.save();
        res.json({ success: true });
    } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ success: false });
    }
});

// Delete a message
router.delete("/shot/messages/delete/:id", async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ success: false });
    }
});

// Fetch all announcements
router.get("/shot/announcements", async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ timestamp: -1 });
        res.render("shotAnnouncements", { announcements });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Add a new announcement
router.post("/shot/announcements/add", async (req, res) => {
    const { title, description, footer } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, error: "Title and description are required" });

    try {
        const newAnnouncement = new Announcement({ title, description, footer });
        await newAnnouncement.save();
        res.json({ success: true });
    } catch (error) {
        console.error("Error adding announcement:", error);
        res.status(500).json({ success: false });
    }
});

// Delete an announcement
router.delete("/shot/announcements/delete/:id", async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
