const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Media = require("../models/Media");
const router = express.Router();

// ✅ Passport-style Auth Middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.redirect("/login");
}

// ✅ Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Storage Setup
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "media_uploads",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        public_id: (req, file) => `${Date.now()}_${file.originalname}`,
    },
});
const upload = multer({ storage });

// ✅ Get Media Page
router.get("/media", isAuthenticated, async (req, res) => {
    const media = await Media.find().sort({ timestamp: -1 });
    res.render("media", { user: req.user, media });
});

// ✅ Upload Media
router.post("/media/upload", isAuthenticated, upload.single("image"), async (req, res) => {
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
        console.error("Upload failed:", error);
        res.status(500).send("Upload error");
    }
});

module.exports = router;
