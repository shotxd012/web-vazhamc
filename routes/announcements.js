const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

// Route to display announcements
router.get("/announcements", async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ timestamp: -1 });

        // Pass `user` to the template (if logged in)
        res.render("announcements", { announcements, user: req.user || null });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
