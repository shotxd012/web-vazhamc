const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware to check authentication via Passport.js
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized" });
}

// Multer setup
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "media_uploads",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        public_id: (req, file) => `${Date.now()}_${file.originalname}`,
    },
});
const upload = multer({ storage });


// GET /media
router.get("/media", async (req, res) => {
    const media = await Media.find().sort({ timestamp: -1 });
    res.render("media", { user: req.user, media });
});

// Manage media page
router.get("/profile/manage/media", isAuthenticated, async (req, res) => {
    const media = await Media.find({ discordId: req.user.discordId }).sort({ timestamp: -1 });
    res.render("manageMedia", { user: req.user, media });
});

// Upload new media
router.post("/profile/manage/media/upload", isAuthenticated, upload.single("image"), async (req, res) => {
    const imageUrl = req.file.path;
    const description = req.body.description;
    await new Media({
        username: req.user.username,
        avatar: req.user.avatar,
        discordId: req.user.discordId,
        imageUrl,
        description,
    }).save();
    res.redirect("/profile/manage/media");
});

// Edit description
router.post("/profile/manage/media/:id/edit", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    await Media.findOneAndUpdate({ _id: id, discordId: req.user.discordId }, { description });
    res.redirect("/profile/manage/media");
});

// Delete media
router.get("/profile/manage/media/:id/delete", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    await Media.findOneAndDelete({ _id: id, discordId: req.user.discordId });
    res.redirect("/profile/manage/media");
});


// POST /media/vote/:id/:type
router.post("/media/vote/:id/:type", isAuthenticated, async (req, res) => {
    const { id, type } = req.params;
    const userId = req.user.discordId;

    try {
        const media = await Media.findById(id);
        if (!media) return res.status(404).json({ success: false, message: "Media not found" });

        const existingVote = media.voters?.find(v => v === userId);
        if (existingVote) {
            return res.status(403).json({ success: false, message: "Already voted" });
        }

        if (type === "like") {
            media.likes = (media.likes || 0) + 1;
        } else if (type === "dislike") {
            media.dislikes = (media.dislikes || 0) + 1;
        }

        media.voters = [...(media.voters || []), userId];
        await media.save();

        return res.json({ success: true, count: type === "like" ? media.likes : media.dislikes });
    } catch (err) {
        console.error("Vote error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
