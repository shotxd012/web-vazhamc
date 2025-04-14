const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Comment = require("../models/Comment");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const client = require("../config/discordClient");

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
    try {
        const media = await Media.find().sort({ timestamp: -1 });
        const comments = await Comment.find().sort({ timestamp: 1 }); // oldest first

        res.render("media", { user: req.user, media, comments });
    } catch (err) {
        console.error("Error loading media:", err);
        res.status(500).send("Server Error");
    }
});


// Manage media page
router.get("/profile/manage/media", isAuthenticated, async (req, res) => {
    const media = await Media.find({ discordId: req.user.discordId }).sort({ timestamp: -1 });
    const comments = await Comment.find().sort({ timestamp: 1 }); // include all comments
    res.render("manageMedia", { user: req.user, media, comments });
});

// Upload new media
router.post("/profile/manage/media/upload", isAuthenticated, upload.single("image"), async (req, res) => {
    const imageUrl = req.file.path;
    const description = req.body.description;

    const media = await new Media({
        username: req.user.username,
        avatar: req.user.avatar,
        discordId: req.user.discordId,
        imageUrl,
        description,
    }).save();

    // --- Discord Embed using Bot Client ---
    try {
        const channel = await client.channels.fetch(process.env.DISCORD_MEDIA_CHANNEL_ID);
        if (!channel) {
            console.error("❌ Media channel not found.");
            return res.redirect("/profile/manage/media");
        }

        const embed = new EmbedBuilder()
            .setTitle(`Web Media Uploaded`)
            .setAuthor({
                name: req.user.username,
                iconURL: `https://cdn.discordapp.com/avatars/${req.user.discordId}/${req.user.avatar}.png`
              })  
            .setImage(imageUrl)
            .setColor(0x00c48c)
            .setDescription(description || "*No description provided*")
            .addFields([
                {
                    name: "Media ID",
                    value: `\`${media._id}\``,
                    inline: true,
                },
                {
                    name: "Likes",
                    value: `\`${media.likes || 0}\``,
                    inline: true,
                },
                {
                    name: "Dislikes",
                    value: `\`${media.dislikes || 0}\``,
                    inline: true,
                },
            ])

            .setFooter({ text: `User ID: ${req.user.discordId}` })
            .setTimestamp()
        const viewBtn = new ButtonBuilder()
            .setLabel("📷 View in Media Gallery")
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.BASE_URL}/media`);

        const row = new ActionRowBuilder().addComponents(viewBtn);

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Media uploaded and embed sent to Discord.`);
    } catch (err) {
        console.error("❌ Failed to send media embed:", err);
    }

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

// GET /media/:id
router.get("/media", async (req, res) => {
    const media = await Media.find().sort({ timestamp: -1 });
    const comments = await Comment.find().sort({ timestamp: 1 }); // oldest first

    res.render("media", { user: req.user, media, comments });
});

router.post("/media/comment/:mediaId", isAuthenticated, async (req, res) => {
    const { mediaId } = req.params;
    const { message } = req.body;

    if (!message.trim()) return res.status(400).json({ success: false, message: "Empty comment" });

    await Comment.create({
        mediaId,
        userId: req.user.discordId,
        username: req.user.username,
        avatar: req.user.avatar,
        message
    });

    res.json({ success: true, message: "Comment added" });
});

router.post("/media/comment/:mediaId", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { mediaId } = req.params;
    const { message } = req.body;

    try {
        await new Comment({
            mediaId,
            userId: req.user.discordId,
            username: req.user.username,
            avatar: req.user.avatar,
            message
        }).save();

        res.json({ success: true });
    } catch (err) {
        console.error("Comment error:", err);
        res.status(500).json({ success: false, message: "Failed to comment" });
    }
});

// Delete a comment (Only media owner can do this)
router.post("/profile/manage/media/:commentId/comment/delete", isAuthenticated, async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).send("Comment not found");

    const media = await Media.findById(comment.mediaId);
    if (!media || media.discordId !== req.user.discordId) {
        return res.status(403).send("Unauthorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);
    res.redirect("/profile/manage/media");
});




module.exports = router;
