const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Media = require("../models/Media");

router.get("/profile", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    res.render("profile", { user: req.user });
});

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "media_uploads",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        public_id: (req, file) => `${Date.now()}_${file.originalname}`,
    },
});

const upload = multer({ storage });

// Upload route on profile
router.post("/profile/upload", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");

    try {
        const imageUrl = req.file.path;

        await new Media({
            username: req.user.username,
            avatar: req.user.avatar,
            discordId: req.user.discordId,
            imageUrl,
        }).save();

        res.redirect("/media");
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).send("Failed to upload");
    }
});

module.exports = router;
