const express = require("express");
const router = express.Router();
const Media = require("../../models/Media");
const Comment = require("../../models/Comment");
const User = require("../../models/User");
const isStaff = require("../../middleware/isStaff");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const client = require("../../config/discordClient");

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "media_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    public_id: (req, file) => `${Date.now()}_${file.originalname}`,
  },
});
const upload = multer({ storage });

// GET /admin/media - Admin Media Management
router.get("/", isStaff, async (req, res) => {
    try {
        // Get media with user information
        const media = await Media.find()
            .sort({ timestamp: -1 })
            .lean();

        // Get comments with user information
        const comments = await Comment.find()
            .sort({ timestamp: -1 })
            .lean();
        
        // Get media statistics
        const totalMedia = await Media.countDocuments();
        const totalComments = await Comment.countDocuments();
        
        // Get top media users with user information
        const topMediaUsers = await Media.aggregate([
            { $group: { _id: "$discordId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get user information for top media users
        const topUsersWithInfo = await Promise.all(
            topMediaUsers.map(async (user) => {
                const userInfo = await User.findOne({ discordId: user._id });
                return {
                    ...user,
                    username: userInfo ? userInfo.username : 'Unknown User',
                    avatar: userInfo ? userInfo.avatar : null
                };
            })
        );

        // Get user information for media
        const mediaWithUserInfo = await Promise.all(
            media.map(async (item) => {
                const userInfo = await User.findOne({ discordId: item.discordId });
                return {
                    ...item,
                    username: userInfo ? userInfo.username : 'Unknown User',
                    avatar: userInfo ? userInfo.avatar : null
                };
            })
        );

        // Get user information for comments
        const commentsWithUserInfo = await Promise.all(
            comments.map(async (comment) => {
                const userInfo = await User.findOne({ discordId: comment.userId });
                return {
                    ...comment,
                    username: userInfo ? userInfo.username : 'Unknown User',
                    avatar: userInfo ? userInfo.avatar : null
                };
            })
        );

        res.render("admin/media", {
            user: req.user,
            media: mediaWithUserInfo,
            comments: commentsWithUserInfo,
            totalMedia,
            totalComments,
            topMediaUsers: topUsersWithInfo
        });
    } catch (error) {
        console.error("Media Management Error:", error);
        res.status(500).send("Error loading media management");
    }
});

// Upload new media (Admin version)
router.post("/upload", isStaff, upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file.path;
    const description = req.body.description;

    const media = await new Media({
      userId: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      url: imageUrl,
      description,
    }).save();

    // Send to Discord
    const channel = await client.channels.fetch(process.env.DISCORD_MEDIA_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle(`Admin Media Upload`)
        .setAuthor({
          name: req.user.username,
          iconURL: req.user.avatar
        })
        .setImage(imageUrl)
        .setColor(0x00c48c)
        .setDescription(description || "*No description provided*")
        .addFields([
          { name: "Media ID", value: `\`${media._id}\``, inline: true },
        ])
        .setFooter({ text: `Admin Upload` })
        .setTimestamp();

      const viewBtn = new ButtonBuilder()
        .setLabel("📷 View in Media Gallery")
        .setStyle(ButtonStyle.Link)
        .setURL(`${process.env.BASE_URL}/media`);

      const row = new ActionRowBuilder().addComponents(viewBtn);
      await channel.send({ embeds: [embed], components: [row] });
    }

    res.redirect("/admin/media");
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Error uploading media");
  }
});

// Edit media description
router.post("/:id/edit", isStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    await Media.findByIdAndUpdate(id, { description });
    res.redirect("/admin/media");
  } catch (error) {
    res.status(500).send("Error updating media");
  }
});

// DELETE /admin/media/:id - Delete media
router.delete("/:id", isStaff, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }

        // Delete from Cloudinary
        const publicId = media.url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);

        // Delete all comments associated with this media
        await Comment.deleteMany({ mediaId: req.params.id });

        // Delete the media document
        await Media.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "Media deleted successfully" });
    } catch (error) {
        console.error("Delete Media Error:", error);
        res.status(500).json({ success: false, message: "Error deleting media" });
    }
});

// DELETE /admin/media/comment/:id - Delete comment
router.delete("/comment/:id", isStaff, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ success: false, message: "Error deleting comment" });
    }
});

module.exports = router; 