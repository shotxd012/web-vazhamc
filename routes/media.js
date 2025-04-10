const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Media = require("../models/Media");
const router = express.Router();

// ✅ Define isAuthenticated middleware first
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized" });
}

// ✅ Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer setup
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "media_uploads",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        public_id: (req, file) => `${Date.now()}_${file.originalname}`,
    },
});
const upload = multer({ storage });

// ... Your GET /media and POST /media/upload routes here ...

// ✅ This route must come after isAuthenticated is defined
router.post("/media/vote/:id/:type", isAuthenticated, async (req, res) => {
    const { id, type } = req.params;
    const userId = req.session.user.discordId;

    if (!["like", "dislike"].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid vote type" });
    }

    try {
        const media = await Media.findById(id);
        if (!media) return res.status(404).json({ success: false, message: "Media not found" });

        // Prevent double voting
        if (!media.votedBy) media.votedBy = [];
        if (media.votedBy.includes(userId)) {
            return res.json({ success: false, message: "You already voted." });
        }

        media[type + "s"] = (media[type + "s"] || 0) + 1;
        media.votedBy.push(userId);
        await media.save();

        res.json({ success: true, count: media[type + "s"] });
    } catch (error) {
        console.error("Vote error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
